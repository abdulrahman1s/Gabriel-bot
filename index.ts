import 'dotenv/config'
import { createServer } from 'http'

createServer((_req, res) => {
    res.write('Hello')
    res.end()
}).listen(process.env.PORT ?? 8080)

import type { DB } from '@types'
import type { Guild, GuildAuditLogsEntry, GuildAuditLogsActions } from 'discord.js'
import { Client, Intents, Collection, Permissions, GuildChannel } from 'discord.js'
import config from './config'

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_PRESENCES
    ],
    partials: ['GUILD_MEMBER'], // I don't really know what is this xD
    restTimeOffset: 0 // Let us faster!
})

const db: DB = new Collection()

const BAD_PERMISSIONS = [
    Permissions.FLAGS.ADMINISTRATOR,
    Permissions.FLAGS.MANAGE_CHANNELS,
    Permissions.FLAGS.MANAGE_GUILD,
    Permissions.FLAGS.MANAGE_ROLES,
    Permissions.FLAGS.MANAGE_WEBHOOKS,
    Permissions.FLAGS.BAN_MEMBERS,
    Permissions.FLAGS.KICK_MEMBERS
]

const DMOwner = (guild: Guild, message: string) => guild.fetchOwner().then((owner) => owner.send(message)).catch(() => null)
const fetchLog = async (guild: Guild, type: keyof GuildAuditLogsActions, targetId?: string): Promise<GuildAuditLogsEntry | null> => {
    try {
        if (!guild.me) await guild.members.fetch(client.user!.id)
        if (!guild.me?.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) return null

        const log = await guild.fetchAuditLogs({ type, limit: 1 }).then(({ entries }) => entries.first())

        if (!log?.executor || (log.createdTimestamp - Date.now()) > 3000) return null
        if (targetId && (log.target as { id: string })?.id !== targetId) return null

        return log
    } catch (error) {
        console.log(error)
        return null
    }
}

const addAction = async (guild: Guild, audit?: GuildAuditLogsEntry | null): Promise<void> => {
    if (!audit || audit.executor!.id === guild.ownerID) return
    if (config.WHITE_LIST.includes(audit.executor!.id)) return

    const actionInfo = {
        id: (10e4 + Math.floor(Math.random() * (10e4 - 1))).toString(),
        executor: await guild.members.fetch(audit.executor!.id),
        guildId: guild.id,
        type: audit.actionType,
        timestamp: audit.createdTimestamp
    }

    db.set(actionInfo.id, actionInfo)

    setTimeout(() => db.delete(actionInfo.id), config.TIMEOUT)

    const limited = db.filter((action) => action.executor.id === actionInfo.executor.id && action.type === actionInfo.type && action.guildId === guild.id).size >= config.LIMITS[actionInfo.type]

    if (limited) {
        DMOwner(guild, `**${audit.executor!.tag}** (ID: \`${audit.executor!.id}\`) is limited!!\nType: \`${actionInfo.type}\``)

        await Promise.allSettled([
            actionInfo.executor.roles.set([]),
            actionInfo.executor.roles.botRole?.setPermissions(0n)
        ])
    }

    const globalLimits = db.filter((action) => action.type === actionInfo.type && action.guildId === guild.id && (action.timestamp - Date.now()) >= 5000)

    if (globalLimits.size >= 5) { // 5/5s on the same action, That's mean multiple attackers..
        for (let i = 0; i < 5; i++) {
            DMOwner(guild, '**WARNING: GLOBAL RATE LIMIT WAKE UP!!**')
        }

        const promisees = [
            guild.roles.cache.map((role) => {
                if (role.editable) return role.setPermissions(0n, 'Anti-raid (GLOBAL LIMIT: 5/5s)')
            }),
            globalLimits.map(({ executor }) => {
                if (executor.bannable) return executor.ban({ reason: 'Anti-raid (GLOBAL LIMIT: 5/5s)' })
            })
        ]

        await Promise.allSettled(promisees.flat() as Promise<unknown>[])
    }
}

client.on('ready', (): void => {
    console.log('Connected')
    client.user!.setStatus('invisible')
})


client
    .on('channelCreate', async (channel): Promise<void> => {
        await fetchLog(channel.guild, 'CHANNEL_CREATE', channel.id).then((audit) => addAction(channel.guild, audit))
    })
    .on('channelUpdate', async (channel): Promise<void> => {
        if (!(channel instanceof GuildChannel)) return
        await fetchLog(channel.guild, 'CHANNEL_UPDATE', channel.id).then((audit) => addAction(channel.guild, audit))
    })
    .on('channelDelete', async (channel): Promise<void> => {
        if (channel.type === 'dm') return
        await fetchLog(channel.guild, 'CHANNEL_DELETE', channel.id).then((audit) => addAction(channel.guild, audit))
    })
    .on('guildBanAdd', async (ban): Promise<void> => {
        await fetchLog(ban.guild, 'MEMBER_BAN_ADD').then((audit) => addAction(ban.guild, audit))
    })
    .on('webhookUpdate', async (channel): Promise<void> => {
        await fetchLog(channel.guild, 'WEBHOOK_UPDATE').then((audit) => addAction(channel.guild, audit))
    })
    .on('roleCreate', async (role): Promise<void> => {
        await fetchLog(role.guild, 'ROLE_CREATE', role.id).then((audit) => addAction(role.guild, audit))
    })
    .on('roleDelete', async (role): Promise<void> => {
        await fetchLog(role.guild, 'ROLE_DELETE', role.id).then((audit) => addAction(role.guild, audit))
    })
    .on('roleUpdate', async (role): Promise<void> => {
        await fetchLog(role.guild, 'ROLE_UPDATE', role.id).then((audit) => addAction(role.guild, audit))
    })
    .on('guildMemberRemove', async (member): Promise<void> => {
        await fetchLog(member.guild, 'MEMBER_KICK', member.id).then((audit) => addAction(member.guild, audit))
    })
    .on('guildMemberUpdate', async (oldMember, member): Promise<void> => {
        if (member.roles.cache.size <= oldMember.roles.cache.size) return
        if (member.id === client.user!.id || member.id === member.guild.ownerID) return
        if (oldMember.permissions.has(BAD_PERMISSIONS)) return

        const role = member.roles.cache.find((r) => !oldMember.roles.cache.has(r.id))

        if (role?.permissions.any(BAD_PERMISSIONS)) {
            const log = await fetchLog(member.guild, 'MEMBER_ROLE_UPDATE', member.id)

            if (!log?.executor || (log.executor.id !== client.user!.id && log.executor.id !== member.guild.ownerID)) {
                if (log?.executor && config.WHITE_LIST.includes(log.executor.id)) return
                await member.roles.remove(role.id, `(${log?.executor?.tag || 'Unknown#0000'}): DON\'T GIVE ANYONE ROLE WITH THAT PERMISSIONs .-.`).catch(() => null)
            }
        }
    })
    .login(process.env.TOKEN)



process
    .on('uncaughtException', (error) => console.error(error))
    .on('unhandledRejection', (error) => console.error(error))
    .on('warning', (info) => console.warn(info))