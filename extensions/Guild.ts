import type { Action } from '@types'
import type { GuildAuditLogsActions, GuildAuditLogsEntry, Snowflake } from 'discord.js'
import { Structures, Permissions } from 'discord.js'
import { ActionManager } from '../structures'
import { BAD_PERMISSIONS, LIMITS } from '../Constants'
import config from '../config'




Structures.extend('Guild', Base => class Guild extends Base {
	readonly actions = new ActionManager()
	readonly running = new Set<string>()

	get owner() {
		return this.members.cache.get(this.ownerID) ?? null
	}


	async check(audit?: GuildAuditLogsEntry | null): Promise<void> {
		if (!audit?.executor || this.isCIA(audit.executor.id)) return
		if ((audit.target as { id?: string })?.id === audit.executor.id) return

		const action: Action = {
			id: audit.id,
			executorId: audit.executor.id,
			timestamp: audit.createdTimestamp,
			type: audit.actionType
		}

		const db = this.actions.add(action)

		if (!this.isIgnored(action.executorId) && !this.running.has(action.executorId)) {
			const limited = db.filter(({ type }) => type === action.type).size >= LIMITS[action.type]

			if (limited) {
				this.running.add(audit.executor.id)

				this.owner?.dm(`**${audit.executor.tag}** (ID: \`${action.executorId}\`) is limited!!\nType: \`${action.type}\``)

				const botRole = this.roles.botRoleFor(action.executorId)

				await Promise.allSettled([
					this.members.edit(action.executorId, { roles: botRole ? [botRole] : [] }),
					botRole?.setPermissions(0n)
				])

				this.running.delete(action.executorId)
			}
		}

		if (this.running.has('GLOBAL')) return


		const globalLimited = this.actions.flat().filter(({ type, timestamp }) => type === action.type && (Date.now() - timestamp) <= LIMITS.GLOBAL.TIME)


		if (globalLimited.length >= LIMITS.GLOBAL.MAX) {
			this.running.add('GLOBAL')

			this.owner?.dm('**WARNING: GLOBAL RATE LIMIT WAKE UP!!**', { times: 5 })

			const promises: Promise<unknown>[][] = [
				this.roles.cache.map((role) => role.setPermissions(role.permissions.freeze().remove(BAD_PERMISSIONS))),
				this.channels.cache.map((channel) => channel.permissionOverwrites.filter((overwrite) => overwrite.allow.any(BAD_PERMISSIONS)).map((overwrite) => overwrite.delete())).flat(),
				globalLimited.map(({ executorId }) => this.isIgnored(executorId) ? Promise.resolve() : this.bans.create(executorId))
			]

			await Promise.allSettled(promises.flat())
			await this.setVerificationLevel('VERY_HIGH').catch(() => null)

			this.running.delete('GLOBAL')
		}
	}

	async fetchAudit(type: keyof GuildAuditLogsActions, targetId?: string): Promise<GuildAuditLogsEntry | null> {
		try {
			if (!this.me?.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) return null

			const log = await this.fetchAuditLogs({ type, limit: 1 }).then(({ entries }) => entries.first())

			if (!log) return null

			if (Date.now() - log.createdTimestamp >= 3000) return null

			if (targetId && (log.target as { id?: string })?.id !== targetId) return null

			return log
		} catch {
			return null
		}
	}

	isCIA(id: Snowflake): boolean {
		return id === this.ownerID || id === this.client.user!.id
	}

	isIgnored(id: Snowflake): boolean {
		return this.isCIA(id) || config.IGNORED_IDS.includes(id)
	}
})