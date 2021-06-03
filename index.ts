import { config as loadEnvFile } from 'dotenv'

loadEnvFile()

import { createServer } from 'http'

createServer((_req, res) => {
    res.write('Hello')
    res.end()
}).listen(process.env.PORT ?? 8080)

// load extensions.
import './extensions/GuildMember'
import './extensions/Guild'

import { Client, Intents } from './structures'
import * as Events from './events'
import * as Commands from './commands'

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
    console.log(client.user!.tag)

    for (const [eventName, event] of Object.entries(Events)) {
        client.on(eventName, (...args) => (event as unknown as (...args: unknown[]) => void)(...args, client))
    }

    console.log(`Loaded a total of ${Object.keys(Events).length} events.`)

    for (const Command of Object.values(Commands)) {
        const command = new Command()
        client.commands.set(command.name, command)
    }

    console.log(`Loaded a total of ${Object.keys(Commands).length} commands.`)


    const promises: Promise<unknown>[] = []

    for (const guild of client.guilds.cache.values()) {
        promises.push(guild.members.fetch())
    }

    await Promise.all(promises)

    console.log('Everything fine...')
})

client.on('guildCreate', (guild) => void guild.members.fetch())


client
    .on('channelUpdate', async (channel): Promise<void> => {
        if ('guild' in channel) {
            await channel.guild.check(await channel.guild.fetchAudit('CHANNEL_UPDATE', channel.id))
        }
    })
    .on('channelDelete', async (channel): Promise<void> => {
        if ('guild' in channel) {
            await channel.guild.check(await channel.guild.fetchAudit('CHANNEL_DELETE', channel.id), channel)
        }
    })
    .on('channelCreate', async (channel): Promise<void> => channel.guild.check(await channel.guild.fetchAudit('CHANNEL_CREATE', channel.id), channel))
    .on('guildBanAdd', async (ban): Promise<void> => ban.guild.check(await ban.guild.fetchAudit('MEMBER_BAN_ADD')))
    .on('webhookUpdate', async (channel): Promise<void> => channel.guild.check(await channel.guild.fetchAudit('WEBHOOK_UPDATE')))
    .on('roleCreate', async (role): Promise<void> => await role.guild.check(await role.guild.fetchAudit('ROLE_CREATE', role.id), role))
    .on('roleDelete', async (role): Promise<void> => role.guild.check(await role.guild.fetchAudit('ROLE_DELETE', role.id), role))
    .on('roleUpdate', async (role): Promise<void> => role.guild.check(await role.guild.fetchAudit('ROLE_UPDATE', role.id)))
    .on('guildMemberRemove', async (member): Promise<void> => member.guild.check(await member.guild.fetchAudit('MEMBER_KICK', member.id)))
    .login(process.env.TEST_TOKEN || process.env.TOKEN)



process
    .on('uncaughtException', (error) => console.error(error))
    .on('unhandledRejection', (error) => console.error(error))
    .on('warning', (info) => console.warn(info))
