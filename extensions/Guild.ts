import type { Action } from '@types'
import type { GuildAuditLogsActions, GuildAuditLogsActionType, GuildAuditLogsEntry, Snowflake, User } from 'discord.js'
import { Structures } from 'discord.js'
import { BAD_PERMISSIONS, IGNORED_IDS, LIMITS, TRUSTED_BOTS } from '../Constants'
import { ActionManager } from '../structures'

class Guild extends Structures.get('Guild') {
    readonly actions = new ActionManager()
    readonly running = new Set<'GLOBAL' | Snowflake>()

    get owner() {
        return this.members.cache.get(this.ownerID) ?? null
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

        const limited = db.filter(({ type }) => type === action.type).size >= LIMITS[action.type]

        if (!limited) return false

        this.owner?.dm(`**${user.tag}** (ID: \`${user.id}\`) is limited!!\nType: \`${entry.actionType}\``)

        this.running.add(user.id)

        const promises: Promise<unknown>[] = []
        const botRole = this.roles.botRoleFor(user.id)

        promises.push(this.members.edit(user.id, { roles: botRole ? [botRole] : [] }))

        if (botRole) {
            promises.push(botRole.setPermissions(botRole.permissions.remove(BAD_PERMISSIONS)))
        }

        const badOverwrites = this.channels.cache
            .map((channel) => {
                if ('permissionOverwrites' in channel) {
                    return channel.permissionOverwrites
                        .filter(({ id, allow }) => id === user.id && allow.any(BAD_PERMISSIONS))
                        .array()
                } else {
                    return []
                }
            })
            .flat()

        promises.push(...badOverwrites.map((overwrite) => overwrite.delete()))

        await Promise.allSettled(promises)

        this.running.delete(user.id)

        return true
    }

    private async _checkGlobal(type: GuildAuditLogsActionType): Promise<void> {
        if (this.running.has('GLOBAL')) return

        const limited = this.actions
            .flat()
            .filter((action) => action.type === type && Date.now() - action.timestamp <= LIMITS.GLOBAL.TIME)

        if (!(limited.length >= LIMITS.GLOBAL.MAX)) return

        this.running.add('GLOBAL')

        this.owner?.dm('**WARNING: GLOBAL RATE LIMIT WAKE UP!!**', { times: 5 })

        const promises: Promise<unknown>[][] = [
            this.roles.cache.map((role) => role.setPermissions(role.permissions.remove(BAD_PERMISSIONS))),
            this.channels.cache
                .map((channel) => {
                    if ('permissionOverwrites' in channel) {
                        return channel.permissionOverwrites
                        .filter(({ allow }) => allow.any(BAD_PERMISSIONS))
                        .map((overwrite) => overwrite.delete())
                    } else {
                        return []
                    }
                })
                .flat(),
            limited.map(({ executorId }) =>
                this.isIgnored(executorId) ? Promise.resolve() : this.bans.create(executorId)
            )
        ]

        await Promise.allSettled(promises.flat())
        await this.setVerificationLevel('VERY_HIGH').catch(() => null)

        this.running.delete('GLOBAL')
    }

    async check(type: keyof GuildAuditLogsActions, targetId?: Snowflake): Promise<void> {
        const entry = await this.fetchEntry(type, targetId),
            user = entry?.executor

        if (
            entry &&
            user &&
            !this.isCIA(user.id) &&
            !TRUSTED_BOTS.has(user.id) &&
            (entry.target as { id?: Snowflake })?.id !== user.id
        ) {
            await Promise.all([this._checkUser(user, entry), this._checkGlobal(entry.actionType)])
        }
    }

    async fetchEntry(type: keyof GuildAuditLogsActions, targetId?: Snowflake): Promise<GuildAuditLogsEntry | null> {
        try {
            const entry = await this.fetchAuditLogs({ type, limit: 1 })
                .then(({ entries }) => entries.first())
                .catch(() => null)

            if (!entry) return null

            if (Date.now() - entry.createdTimestamp > 3000) return null

            if (targetId && (entry.target as { id?: Snowflake })?.id !== targetId) return null

            return entry
        } catch {
            return null
        }
    }

    isCIA(id: Snowflake): boolean {
        return this.client.owners.has(id) || id === this.client.user!.id
    }

    isIgnored(id: Snowflake): boolean {
        return this.isCIA(id) || IGNORED_IDS.includes(id)
    }
}

Structures.extend('Guild', () => Guild)
