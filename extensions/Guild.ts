import type { Action, RawData } from '@types'
import type { GuildAuditLogsActions, GuildAuditLogsEntry, Snowflake, Role, GuildBan, GuildChannel, Guild } from 'discord.js'
import { Structures, Permissions, Collection } from 'discord.js'
import { convertToRaw } from '../utils'
import config from '../config'

const USER_REASON = 'Anti-raid', GLOBAL_REASON = USER_REASON + ' (GLOBAL RATE LIMIT)'

const rePast = (thing: RawData, guild: Guild) => {
	if (thing.created) {
		switch (thing.type) {
			case 'BAN': return guild.bans.remove(thing.ban!.userId)
			case 'CHANNEL': return Promise.resolve(guild.channels.cache.get(thing.channel!.id)?.delete())
			case 'ROLE': return Promise.resolve(guild.roles.cache.get(thing.role!.id)?.delete())
		}
	} else if (thing.deleted) {
		switch (thing.type) {
			case 'BAN': return guild.bans.create(thing.ban!.userId)
			case 'CHANNEL': return guild.channels.create(thing.channel!.name, thing.channel!)
			case 'ROLE':
				if (thing.role!.permissions === 0n) delete thing.role!.permissions 
				return guild.roles.create(thing.role)
		}
	} else throw new Error('un-handled audit type')
}


Structures.extend('Guild', Base => class Guild extends Base {
	private readonly actions = new Collection<string, Collection<string, Action>>()
	readonly running = new Set<string>()

	get owner() {
		return this.members.cache.get(this.ownerID) ?? null
	}

	isCIA(id: Snowflake): boolean {
		return id === this.ownerID || id === this.client.user!.id
	}

	async resolveAction(audit?: GuildAuditLogsEntry | null, data?: GuildChannel | Role | GuildBan): Promise<void> {
		if (!audit?.executor || this.isCIA(audit.executor.id)) return

		if (!this.actions.has(audit.executor.id)) this.actions.set(audit.executor.id, new Collection())

		const db = this.actions.get(audit.executor.id)!
		const actionInfo: Action = {
			id: audit.id,
			executorId: audit.executor.id,
			type: audit.actionType,
			timestamp: audit.createdTimestamp,
			data: data ? convertToRaw(data, audit.actionType) : null
		}

		db.set(actionInfo.id, actionInfo)

		setTimeout(() => db.delete(actionInfo.id), config.TIMEOUT)

		if (!this.isIgnored(audit.executor.id) && !this.running.has(audit.executor.id)) {
			const limited = db.filter((action) => action.type === actionInfo.type).size >= config.LIMITS[actionInfo.type]

			if (limited) {
				this.running.add(audit.executor.id)

				this.owner?.dm(`**${audit.executor.tag}** (ID: \`${audit.executor.id}\`) is limited!!\nType: \`${actionInfo.type}\``)

				const botRole = this.roles.botRoleFor(actionInfo.executorId)

				await Promise.allSettled([
					this.members.edit(actionInfo.executorId, { roles: botRole ? [botRole] : [] }, USER_REASON),
					botRole?.setPermissions(0n, USER_REASON)
				])

				await Promise.allSettled(db.reduce((cur, d) => {
					if (d.data) cur.push(d.data)
					return cur
				}, <RawData[]>[]).map((thing) => rePast(thing, this)) as Promise<unknown>[])


				this.running.delete(audit.executor.id)
			}
		}

		if (this.running.has('GLOBAL')) return


		const globalLimited = this.actions
			.reduce((cur, actions) => {
				cur.push(...actions.values())
				return cur
			}, <Action[]>[])
			.filter((action) => action.type === actionInfo.type && (Date.now() - action.timestamp) <= 15000)


		if (globalLimited.length >= 5) { // 5/15s on the same action, That's mean multiple attackers..
			this.running.add('GLOBAL')

			for (let i = 0; i < 5; i++) {
				this.owner?.dm('**WARNING: GLOBAL RATE LIMIT WAKE UP!!**')
			}

			const promises: Promise<unknown>[][] = [
				this.roles.cache.map((role) => role.editable ? role.setPermissions(role.permissions.freeze().remove(config.BAD_PERMISSIONS), GLOBAL_REASON) : Promise.resolve()),
				globalLimited.map(({ executorId }) => this.isIgnored(executorId) ? Promise.resolve() : this.bans.create(executorId, { reason: GLOBAL_REASON }))
			]

			await Promise.allSettled(promises.flat() as Promise<unknown>[])

			await this.setVerificationLevel('VERY_HIGH').catch(() => null)

			this.running.delete('GLOBAL')
		}
	}

	async fetchAudit(type: keyof GuildAuditLogsActions, targetId?: string): Promise<GuildAuditLogsEntry | null> {
		try {
			if (!this.me) await this.members.fetch(this.client.user!.id)
			if (!this.me?.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) return null

			const log = await this.fetchAuditLogs({ type, limit: 1 }).then(({ entries }) => entries.first())

			if (!log) return null

			if (Date.now() - log.createdTimestamp >= 3000) return null

			if (targetId && (log.target as { id?: string })?.id !== targetId) return null

			return log
		} catch (e) {
			console.error(e)
			return null
		}
	}

	isIgnored(id: Snowflake): boolean {
		return this.isCIA(id) || config.WHITE_LIST.includes(id) || config.IGNORED_CHANNELS.includes(id)
	}
})