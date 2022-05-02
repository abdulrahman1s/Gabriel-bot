import { Guild, GuildAuditLogsActions, GuildAuditLogsEntry, Role, TextChannel, Permissions } from 'discord.js'
import { BAD_PERMISSIONS } from '../Constants'
import { ActionManager, Action, Snapshot } from '../structures'
import { setTimeout as sleep } from 'timers/promises'
import ms from 'ms'
import config from '../config'


Guild.prototype.fetchEntry = async function (
    type: keyof GuildAuditLogsActions,
    targetId?: string,
    retry = false
): Promise<GuildAuditLogsEntry<'ALL'> | null> {
    const entry = await this.fetchAuditLogs({ type, limit: 5 }).then(({ entries }) => {
        if (targetId) {
            return entries.find((e) => (e.target as { id?: string })?.id === targetId)
        }
        return entries.first()
    }).catch(() => null)

    if (!entry && !retry) {
        await sleep(1000)
        return this.fetchEntry(type, targetId, true)
    }

    if (!entry?.executor || Date.now() - entry.createdTimestamp > 5000) return null

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

Guild.prototype.check = async function (type: keyof GuildAuditLogsActions, targetId?: string) {
    if (!this.active) return

    const entry = await this.fetchEntry(type, targetId), user = entry?.executor

    if (!user || this.client.owners.has(user.id)) return

    const local = async () => {
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
        } finally {
            this.running.delete(user.id)
        }

        if (config.snapshots) await Snapshot.restore(this)

        return true
    }

    const global = async () => {
        if (this.running.has('GLOBAL')) return

        const result = this.actions.scan(entry.actionType)

        if (!result.redAlert) return

        this.running.add('GLOBAL')

        this.owner?.dm(`**------------ RED ALERT -------------**\nThe server **${this.name}** is under attack by multiple hackers..`, 3)

        const promises: Promise<unknown>[] = []

        for (const a of result.actions) promises.push(this.bans.create(a.executorId))

        for (const channel of this.channels.cache.values()) {
            if (channel.isThread()) continue
            for (const overwrite of channel.permissionOverwrites.cache.values()) if (overwrite.allow.any(BAD_PERMISSIONS)) {
                promises.push(overwrite.delete())
            }
        }

        for (const role of this.roles.cache.values()) if (role.permissions.any(BAD_PERMISSIONS)) {
            promises.push(role.setPermissions(role.permissions.remove(BAD_PERMISSIONS)))
        }


        if (this.verificationLevel !== 'VERY_HIGH') {
            promises.push(this.setVerificationLevel('VERY_HIGH'))
        }

        await Promise.allSettled(promises)

        this.running.delete('GLOBAL')

        if (config.snapshots) await Snapshot.restore(this)
    }

    await local().then(global)
}


Guild.prototype.setup = async function () {
    const me = this.me || await this.members.fetch(this.client.user!.id)

    await this.members.fetch(this.ownerId)

    const power = () => me.roles.highest.id === this.roles.highest.id && me.roles.highest.permissions.has(Permissions.FLAGS.ADMINISTRATOR)

    if (power()) {
        this.active = true
    } else {
        const channel = this.channels.cache.find(c => c.type === 'GUILD_TEXT' && c.permissionsFor(me).has(Permissions.FLAGS.SEND_MESSAGES)) as TextChannel

        await channel?.send(`Hey <@${this.ownerId}>... \nI must have the highest role in the server with admin permissions to work properly\nYou have 2 minutes to do the requirements otherwise I'll just leave`)

        setTimeout(() => {
            if (power()) this.active = true
            else this.leave().catch(() => null)
        }, ms('2 minutes'))
    }
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