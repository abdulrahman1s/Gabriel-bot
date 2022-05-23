import { Guild, GuildAuditLogsActions, GuildAuditLogsEntry, Role, TextChannel, Permissions } from 'discord.js'
import { BAD_PERMISSIONS, DEFAULT_GUILD_SETTINGS } from '../Constants'
import { ActionManager, Action, Snapshot } from '../structures'
import { setTimeout as sleep } from 'timers/promises'
import db from '../database'
import ms from 'ms'


const THREE_MINUTES = ms('3m')

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

Guild.prototype.fetchExecutor = async function (...args: Parameters<Guild['fetchEntry']>) {
    const { executor = null } = (await this.fetchEntry(...args)) ?? {}
    return executor
}

Guild.prototype.punish = async function (userId: string) {
    const promises: Promise<unknown>[] = []
    const roles: Role[] = []
    const botRole = this.roles.botRoleFor(userId)

    if (botRole) {
        roles.push(botRole)
        promises.push(botRole.setPermissions(botRole.permissions.remove(BAD_PERMISSIONS)))
    }

    promises.push(this.members.edit(userId, { roles }))

    for (const channel of this.channels.cache.values()) {
        if (channel.isThread()) continue
        for (const [id, overwrite] of channel.permissionOverwrites.cache) {
            if (id === userId && overwrite.allow.any(BAD_PERMISSIONS)) promises.push(overwrite.delete())
        }
    }

    await Promise.allSettled(promises)

    await this.members.edit(userId, { communicationDisabledUntil: Date.now() + ms('6h') }).catch(() => null)
}

Guild.prototype.check = async function (type: keyof GuildAuditLogsActions, targetId?: string) {
    if (!this.active) return

    const entry = await this.fetchEntry(type, targetId), user = entry?.executor

    if (!user || user.id == this.ownerId) return

    const local = async () => {
        while (this.running.has(user.id)) await sleep(50)

        const action = new Action(entry)

        if (!this.actions.scan(action)) return false
        // Keep in mind. Global Checking will not forgive this
        if (!this.isPunishable(action.executorId)) return false

        this.owner?.dm(`${user.tag} (ID: ${user.id}) has executed the limit of \`${action.type}\`.`)

        this.running.add(user.id)

        try {
            await this.punish(user.id)
        } catch (e) {
            console.error(e)
        } finally {
            this.running.delete(user.id)
        }

        if (this.settings.snapshots.enabled) await Snapshot.restore(this)

        return true
    }

    const global = async () => {
        if (this.running.has('GLOBAL')) return

        const result = this.actions.globalScan(entry.actionType)

        if (!result.redAlert) return

        this.running.add('GLOBAL')

        this.owner?.dm(`**------------ RED ALERT -------------**\nThe server **${this.name}** is under attack by multiple hackers..`, 3)

        const promises: Promise<unknown>[] = []

        for (const a of result.actions.values()) promises.push(this.bans.create(a.executorId))

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

        if (this.settings.snapshots.enabled) await Snapshot.restore(this)
    }

    await local().then(global)
}


Guild.prototype.setup = async function () {
    this.active = false

    const me = this.me || await this.members.fetch(this.client.user!.id)

    await this.members.fetch(this.ownerId)

    const power = () => me.roles.highest.id === this.roles.highest.id && me.roles.highest.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
    const setup = async () => {
        const settings = await db.get(this.id).catch(() => null)
        if (settings) this.settings = JSON.parse(settings)
        this.active = true
        this.snapshot = new Snapshot(this)
    }

    if (power()) {
        await setup()
    } else {
        const channel = this.channels.cache.find(c => c.type === 'GUILD_TEXT' && c.permissionsFor(me).has(Permissions.FLAGS.SEND_MESSAGES)) as TextChannel
        const msg = await channel?.send(`Hey <@${this.ownerId}>... \nI must have the highest role in the server with admin permissions to work properly\nYou have 3 minutes to do the requirements otherwise I'll just leave`)
        const startedAt = Date.now()
        const interval = setInterval(async () => {
            if (power()) {
                await setup()
                msg?.delete().catch(() => null)
                clearInterval(interval)
            } else if (Date.now() - startedAt >= THREE_MINUTES) {
                this.leave().catch(() => null)
                clearInterval(interval)
            }
        }, 1000).ref()
    }
}

Guild.prototype.isPunishable = function (targetId: string) {
    if (targetId === this.ownerId) return false
    if (targetId === this.client.user!.id) return false
    return !this.settings.ignoredIds.includes(targetId)
}


Object.defineProperties(Guild.prototype, {
    active: {
        value: false,
        writable: true,
        enumerable: true
    },
    running: {
        value: new Set()
    },
    actions: {
        get() {
            return ActionManager.get(this)
        }
    },
    owner: {
        get() {
            return this.members.cache.get(this.ownerId)
        }
    },
    settings: {
        value: DEFAULT_GUILD_SETTINGS,
        writable: true,
        enumerable: true
    }
})
