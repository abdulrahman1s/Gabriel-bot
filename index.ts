import 'dotenv/config'
import { createServer } from 'http'

createServer((_req, res) => {
    res.write('Hello')
    res.end()
}).listen(process.env.PORT || 8080)


import { Guild, GuildAuditLogsEntry, GuildAuditLogsActions, GuildMember, GuildAuditLogsActionType, GuildChannel } from 'discord.js'
import { Client, Intents, Collection } from 'discord.js'
import ms from 'ms'


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

const db = new Collection<string, {
    id: string
    executor: GuildMember
    type: GuildAuditLogsActionType
    timestamp: number
}>()


const WHITE_LIST = [
    // Owners
    '567399605877080071',
    // Administrator bots
    '235148962103951360', // Carl
    '282859044593598464', // ProBot
    '831661630424743946', // Discord Bot (my bot)
    '557628352828014614', // Ticket Tool
]
const TIMEOUT = ms('3 minutes')
const LIMITS = <{ [key in GuildAuditLogsActionType]: number }>{
    DELETE: 3,
    UPDATE: 3,
    CREATE: 3,
    ALL: 3
}

const DMOwner = (guild: Guild, message: string) => guild.fetchOwner().then((owner) => owner.send(message)).catch(() => null)
const fetchLog = async (guild: Guild, type: keyof GuildAuditLogsActions, targetId?: string): Promise<GuildAuditLogsEntry | null> => {
    try {
        const log = await guild.fetchAuditLogs({ type, limit: 1 }).then(({ entries }) => entries.first())

        if (!log || (log.createdTimestamp - Date.now()) > 3000) return null
        if (!log.executor) return null
        if (targetId && (log.target as { id: string }).id !== targetId) return null

        return log
    } catch (error) {
        console.log(error)
        return null
    }
}

const addAction = async (guild: Guild, audit?: GuildAuditLogsEntry | null): Promise<void> => {
    if (!audit || audit.executor!.id === guild.ownerID) return
    if (WHITE_LIST.includes(audit.executor!.id)) return

    const actionInfo = {
        id: (10e4 + Math.floor(Math.random() * (10e4 - 1))).toString(),
        executor: await guild.members.fetch(audit.executor!.id),
        type: audit.actionType,
        timestamp: audit.createdTimestamp
    }

    db.set(actionInfo.id, actionInfo)

    setTimeout(() => db.delete(actionInfo.id), TIMEOUT)

    const limited = db.filter((action) => action.executor.id === actionInfo.executor.id && action.type === actionInfo.type).size >= LIMITS[actionInfo.type]

    if (limited) {
        DMOwner(guild, `**${audit.executor!.tag}** (ID: \`${audit.executor!.id}\`) is limited!!\nType: \`${actionInfo.type}\``)
        await actionInfo.executor.edit({ roles: [] }).catch(() => null)
        await actionInfo.executor.roles.botRole?.setPermissions(0n).catch(() => null)
    }

    const globalLimits = db.filter((action) => action.type === actionInfo.type && (action.timestamp - Date.now()) >= 5000)

    if (globalLimits.size >= 5) { // 5/5s on the same action, That's mean multiple attackers..
        for (let i = 0; i < 5; i++) {
            DMOwner(guild, '**WARNING: GLOBAL RATE LIMIT WAKE UP!!**')
        }
        await Promise.all(guild.roles.cache.map((role) => role.setPermissions(0n).catch(() => Promise.resolve(null))))
        await Promise.all(globalLimits.map(({ executor }) => executor.ban({ reason: 'Anti-raid (GLOBAL LIMIT: 5/5s)' }).catch(() => Promise.resolve(null))))
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
        if (oldMember.roles.cache.size === member.roles.cache.size) return
        if (member.roles.cache.size < oldMember.roles.cache.size) return
        if (member.id === client.user!.id || member.id === member.guild.ownerID) return
        if (oldMember.permissions.has('ADMINISTRATOR')) return

        const role = member.roles.cache.find((r) => !oldMember.roles.cache.has(r.id))

        if (!role) return

        if (role.permissions.any([
            'ADMINISTRATOR',
            'MANAGE_CHANNELS',
            'MANAGE_GUILD',
            'BAN_MEMBERS',
            'KICK_MEMBERS',
            'MANAGE_ROLES'
        ])) {
            const log = await fetchLog(member.guild, 'MEMBER_ROLE_UPDATE', member.id)

            if (!log?.executor || (log.executor.id !== client.user?.id && log.executor.id !== member.guild.ownerID)) {
                if (log?.executor && WHITE_LIST.includes(log.executor.id)) return
                await member.roles.remove(role.id, `(${log?.executor?.tag || 'Unknown#0000'}): DON\'T GIVE ANYONE ROLE WITH THAT PERMISSIONs .-.`).catch(() => null)
            }
        }
    })
    .login(process.env.TOKEN)



process
    .on('uncaughtException', (error) => console.error(error))
    .on('unhandledRejection', (error) => console.error(error))
    .on('warning', (info) => console.warn(info))