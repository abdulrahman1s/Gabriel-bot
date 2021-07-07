import type { Action } from '@types'
import {
    Guild as BaseGuild,
    GuildAuditLogsActions,
    GuildAuditLogsActionType,
    GuildAuditLogsEntry,
    Snowflake,
    User
} from 'discord.js'
import { BAD_PERMISSIONS, IGNORED_IDS, LIMITS, TRUSTED_BOTS } from '../Constants'
import { ActionManager } from '../structures'
import config from '../config'

class Guild extends BaseGuild {
    get actions(): ActionManager {
        return ActionManager.get(this.id)
    }

    get owner() {
        return this.members.cache.get(this.ownerId) ?? null
    }

    private async _checkUser(user: User, entry: GuildAuditLogsEntry): Promise<boolean> {
        const action: Action = {
            id: entry.id,
            executorId: user.id,
            timestamp: entry.createdTimestamp,
            type: entry.actionType
        }

        const db = this.actions.add(action)

        if (this.isIgnored(action.executorId) || this.running.has(action.executorId)) return false

        const now = Date.now()
        const limited =
            db.filter(({ type, timestamp }) => type === action.type && now - timestamp <= config.INTERAVL).size >=
            LIMITS[action.type]

        if (!limited) return false

        this.owner?.dm(`**${user.tag}** (ID: \`${user.id}\`) is limited!!\nType: \`${action.type}\``)

        this.running.add(user.id)

        const promises: Promise<unknown>[] = []
        const botRole = this.roles.botRoleFor(user.id)

        promises.push(this.members.edit(user.id, { roles: botRole ? [botRole] : [] }))

        if (botRole) {
            promises.push(botRole.setPermissions(botRole.permissions.remove(BAD_PERMISSIONS)))
        }

        const badOverwrites = this.channels.cache.map((channel) => {
            if (channel.isThread()) return []
            return channel.permissionOverwrites.cache
                .filter(({ id, allow }) => id === user.id && allow.any(BAD_PERMISSIONS))
                .map((overwrite) => overwrite.delete())
        })

        promises.push(...badOverwrites.flat())

        await Promise.allSettled(promises)

        this.running.delete(user.id)

        return true
    }

    private async _checkGlobal(type: GuildAuditLogsActionType): Promise<void> {
        if (this.running.has('GLOBAL')) return

        const now = Date.now()
        const limited = this.actions
            .flat()
            .filter((action) => action.type === type && now - action.timestamp <= LIMITS.GLOBAL.TIME)

        if (!(limited.length >= LIMITS.GLOBAL.MAX)) return

        this.running.add('GLOBAL')

        this.owner?.dm('**WARNING: GLOBAL RATE LIMIT WAKE UP!!**', { times: 5 })

        const promises: Promise<unknown>[] = [
            ...this.roles.cache
                .filter((role) => role.permissions.any(BAD_PERMISSIONS))
                .map((role) => role.setPermissions(role.permissions.remove(BAD_PERMISSIONS))),
            ...this.channels.cache
                .map((channel) => {
                    if (channel.isThread()) return []
                    return channel.permissionOverwrites.cache
                        .filter(({ allow }) => allow.any(BAD_PERMISSIONS))
                        .map((overwrite) => overwrite.delete())
                })
                .flat()
        ]

        for (const { executorId } of limited) {
            if (this.isIgnored(executorId)) {
                const botRole = this.roles.botRoleFor(executorId)
                promises.push(this.members.edit(executorId, { roles: botRole ? [botRole] : [] }))
            } else {
                promises.push(this.bans.create(executorId))
            }
        }

        await Promise.allSettled(promises.flat())

        if (this.verificationLevel !== 'VERY_HIGH') {
            await this.setVerificationLevel('VERY_HIGH').catch(() => null)
        }

        this.running.delete('GLOBAL')
    }

    async check(type: keyof GuildAuditLogsActions, targetId?: Snowflake): Promise<void> {
        const entry = await this.fetchEntry(type, targetId),
            user = entry?.executor

        if (!entry || !user) return
        if (this.isCIA(user.id) || TRUSTED_BOTS.has(user.id)) return

        await Promise.all([this._checkUser(user, entry), this._checkGlobal(entry.actionType)])
    }

    async fetchEntry(
        type: keyof GuildAuditLogsActions,
        targetId?: Snowflake,
        isRetry = false
    ): Promise<GuildAuditLogsEntry | null> {
        const entry = await this.fetchAuditLogs({ type, limit: 1 })
            .then(({ entries }) => entries.first())
            .catch(() => null)

        if (!entry && !isRetry) {
            await this.client.sleep(1000)
            return this.fetchEntry(type, targetId, true)
        }

        if (!entry) return null

        if (Date.now() - entry.createdTimestamp > (isRetry ? 4000 : 3000)) return null

        if (targetId && (entry.target as { id?: Snowflake })?.id !== targetId) return null

        return entry
    }

    isCIA(id: Snowflake): boolean {
        return this.client.owners.has(id) || id === this.client.user!.id
    }

    isIgnored(id: Snowflake): boolean {
        return this.isCIA(id) || IGNORED_IDS.includes(id)
    }
}

Object.defineProperties(BaseGuild.prototype, {
    running: {
        value: new Set<'GLOBAL' | Snowflake>()
    }
})

for (const [name, prop] of Object.entries(Object.getOwnPropertyDescriptors(Guild.prototype))) {
    Object.defineProperty(BaseGuild.prototype, name, prop)
}
