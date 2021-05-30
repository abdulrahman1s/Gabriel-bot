import type { ActionCollection } from '@types'
import type { GuildAuditLogsActions, GuildAuditLogsEntry, Snowflake } from 'discord.js'
import { Structures, Permissions, Collection } from 'discord.js'
import config from '../config'

Structures.extend('Guild', Base => class Guild extends Base {
	protected actions: ActionCollection = new Collection()

	get owner() {
		return this.members.cache.get(this.ownerID) ?? null
	}

	async resolveAction(audit?: GuildAuditLogsEntry | null): Promise<void> {
		if (!audit?.executor) return
		if (this.isIgnored(audit.executor.id)) return

		const db = this.actions
		const actionInfo = {
			id: audit.id,
			executorId: audit.executor.id,
			guildId: this.id,
			type: audit.actionType,
			timestamp: audit.createdTimestamp
		}

		db.set(actionInfo.id, actionInfo)

		setTimeout(() => db.delete(actionInfo.id), config.TIMEOUT)

		const limited = db.filter((action) => action.executorId === actionInfo.executorId && action.type === actionInfo.type && action.guildId === this.id).size >= config.LIMITS[actionInfo.type]

		if (limited) {
			this.owner?.send(`**${audit.executor.tag}** (ID: \`${audit.executor.id}\`) is limited!!\nType: \`${actionInfo.type}\``).catch(() => null)
			await Promise.allSettled([
				this.members.edit(actionInfo.executorId, { roles: [] }, 'Anti-raid'),
				this.roles.botRoleFor(actionInfo.executorId)?.setPermissions(0n, 'Anti-raid'),
			])
		}

		const globalLimited = db.filter((action) => action.type === actionInfo.type && action.guildId === this.id && (Date.now() - action.timestamp) <= 15000)

		if (globalLimited.size >= 5) { // 5/15s on the same action, That's mean multiple attackers..
			for (let i = 0; i < 5; i++) {
				this.owner?.send('**WARNING: GLOBAL RATE LIMIT WAKE UP!!**').catch(() => null)
			}

			const promises = [
				this.roles.cache.map((role) => {
					if (role.editable) return role.setPermissions(0n, 'Anti-raid (GLOBAL LIMIT)')
				}),
				globalLimited.map(({ executorId }) => {
					return this.bans.create(executorId, { reason: 'Anti-raid (GLOBAL LIMIT)' })
				})
			]

			await Promise.allSettled(promises.flat() as Promise<unknown>[])
		}
	}

	async fetchAudit(type: keyof GuildAuditLogsActions, targetId?: string): Promise<GuildAuditLogsEntry | null> {
		try {
			if (!this.me) await this.members.fetch(this.client.user!.id)
			if (!this.me?.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) return null

			const log = await this.fetchAuditLogs({ type, limit: 1 }).then(({ entries }) => entries.first())

			if (!log) return null

			if ((Date.now() - log.createdTimestamp) >= 3000) return null

			if (targetId && (log.target as { id?: string })?.id !== targetId) return null

			return log
		} catch (error) {
			console.log(error)
			return null
		}
	}

	isIgnored(id: Snowflake): boolean {
		return id === this.ownerID || id === this.client.user!.id || config.WHITE_LIST.includes(id) || config.IGNORED_CHANNELS.includes(id)
	}
})