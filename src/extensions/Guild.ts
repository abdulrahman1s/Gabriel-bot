import { Guild, GuildAuditLogsActions, GuildAuditLogsEntry, Role, Snowflake } from 'discord.js'
import { BAD_PERMISSIONS } from '../Constants'
import { ActionManager, Action } from '../structures'
import { setTimeout as sleep } from 'timers/promises'
import ms from 'ms'


Guild.prototype.fetchEntry = async function (
    type: keyof GuildAuditLogsActions,
    targetId?: Snowflake,
    retry = false
): Promise<GuildAuditLogsEntry<'ALL'> | null> {
    const entry = await this.fetchAuditLogs({ type, limit: 5 }).then(({ entries }) => {
        if (targetId) {
            return entries.find((e) => (e.target as { id?: Snowflake })?.id === targetId)
        }
        return entries.first()
    }).catch(() => null)

    if (!entry && !retry) {
        await sleep(1000)
        return this.fetchEntry(type, targetId, true)
    }

    if (!entry || Date.now() - entry.createdTimestamp > 5000) return null

    return entry as GuildAuditLogsEntry<'ALL'>
}

Guild.prototype.punish = async function (userId: string) {
    if (this.client.owners.has(userId)) return
    
    const promises: Promise<unknown>[] = []
    const roles: Role[] = []
    const botRole = this.roles.botRoleFor(userId)

    if (botRole) {
        roles.push(botRole)
        promises.push(botRole.setPermissions(botRole.permissions.remove(BAD_PERMISSIONS)))
    }

    promises.push(this.members.edit(userId, { 
        roles,
        communicationDisabledUntil: Date.now() * ms('6h')
    }))

    for (const channel of this.channels.cache.values()) {
        if (channel.isThread()) continue
        for (const [id, overwrite] of channel.permissionOverwrites.cache) {
            if (id === userId && overwrite.allow.any(BAD_PERMISSIONS)) promises.push(overwrite.delete())
        }
    }

    await Promise.allSettled(promises)
}

Guild.prototype.check = async function (type: keyof GuildAuditLogsActions, targetId?: Snowflake) {
    const entry = await this.fetchEntry(type, targetId), user = entry?.executor

    if (!user) return

    const local = async () => {
        if (this.client.owners.has(user.id)) return

        while (this.running.has(user.id)) await sleep(50)

        const action = new Action(entry)

        if (!this.actions.add(action).scan(action)) return false
        // Keep in mind. Global Checking will not forgive this
        if (!this.client.isPunishable(action.executorId)) return false

        this.owner?.dm(`${user.tag} (ID: ${user.id}) has executed the limit of \`${action.type}\`.`)

        this.running.add(user.id)

        try {
            await this.punish(user.id)
        } catch (e) {
            console.error(e)
            // Ignore
        } finally {
            this.running.delete(user.id)
        }

        return true
    }

    const global = async () => {
        if (this.running.has('GLOBAL')) return

        const result = this.actions.scan(entry.actionType)

        if (!result.redAlert) return

        this.running.add('GLOBAL')

        this.owner?.dm(`**------------ RED ALERT -------------**\nThe server **${this.name}** is under attack by multiple hackers..`, 3)

        const promises: Promise<unknown>[] = []

        try {
            for (const { executorId } of result.actions) {
                promises.push(this.bans.create(executorId))
            }

            for (const channel of this.channels.cache.values()) {
                if (channel.isThread()) continue
                for (const overwrite of channel.permissionOverwrites.cache.values()) {
                    if (overwrite.allow.any(BAD_PERMISSIONS)) promises.push(overwrite.delete())
                }
            }

            for (const role of this.roles.cache.values()) if (role.permissions.any(BAD_PERMISSIONS)) {
                promises.push(role.setPermissions(role.permissions.remove(BAD_PERMISSIONS)))
            }


            if (this.verificationLevel !== 'VERY_HIGH') {
                promises.push(this.setVerificationLevel('VERY_HIGH'))
            }

            await Promise.allSettled(promises)
        } catch (e) {
            console.error(e)
        } finally {
            this.running.delete('GLOBAL')
        }
    }

    await local().then(global)
}


Object.defineProperties(Guild.prototype, {
    running: {
        value: new Set()
    },
    actions: {
        get() {
            return ActionManager.get(this.id)
        }
    },
    owner: {
        get() {
            return this.members.cache.get(this.ownerId)
        }
    }
})