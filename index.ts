import { config as loadEnvFile } from 'dotenv'

loadEnvFile()

import { createServer } from 'http'

createServer((_req, res) => {
    res.write('Hello')
    res.end()
}).listen(process.env.PORT ?? 8080)

// load extensions.
import './extensions/Guild'
import './extensions/Role'

import { Client, Intents, GuildChannel } from 'discord.js'
import * as CustomEvents from './custom-events'

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_WEBHOOKS
    ],
    restTimeOffset: 0, // Let us faster!
    presence: { 
        status: 'invisible'
    }
})



client.on('ready', async (): Promise<void> => {
    console.log('Connected')

    for (const [eventName, event] of Object.entries(CustomEvents)) {
        client.on(eventName, (...args) => (event as unknown as (...args: unknown[]) => void)(...args, client))
    }

    console.log(`Loaded a total of ${Object.keys(CustomEvents).length} custom events.`)

    const promises: Promise<unknown>[] = []

    for (const guild of client.guilds.cache.values()) {
        promises.push(guild.members.fetch())
    }

    await Promise.all(promises)

    console.log('Everything fine...')
})


client
    .on('channelCreate', async (channel): Promise<void> => {
        await channel.guild.resolveAction(await channel.guild.fetchAudit('CHANNEL_CREATE', channel.id))
    })
    .on('channelUpdate', async (channel): Promise<void> => {
        if (!(channel instanceof GuildChannel)) return
        await channel.guild.resolveAction(await channel.guild.fetchAudit('CHANNEL_UPDATE', channel.id))
    })
    .on('channelDelete', async (channel): Promise<void> => {
        if (channel.type === 'dm') return
        await channel.guild.resolveAction(await channel.guild.fetchAudit('CHANNEL_DELETE', channel.id))
    })
    .on('guildBanAdd', async (ban): Promise<void> => {
        await ban.guild.resolveAction(await ban.guild.fetchAudit('MEMBER_BAN_ADD'))
    })
    .on('webhookUpdate', async (channel): Promise<void> => {
        await channel.guild.resolveAction(await channel.guild.fetchAudit('WEBHOOK_UPDATE'))
    })
    .on('roleCreate', async (role): Promise<void> => {
        await role.guild.resolveAction(await role.guild.fetchAudit('ROLE_CREATE', role.id))
    })
    .on('roleDelete', async (role): Promise<void> => {
        await role.guild.resolveAction(await role.guild.fetchAudit('ROLE_DELETE', role.id))
    })
    .on('roleUpdate', async (role): Promise<void> => {
        await role.guild.resolveAction(await role.guild.fetchAudit('ROLE_UPDATE', role.id))
    })
    .on('guildMemberRemove', async (member): Promise<void> => {
        await member.guild.resolveAction(await member.guild.fetchAudit('MEMBER_KICK', member.id))
    })
    .login(process.env.TOKEN)



process
    .on('uncaughtException', (error) => console.error(error))
    .on('unhandledRejection', (error) => console.error(error))
    .on('warning', (info) => console.warn(info))
