import { config as loadEnvFile } from 'dotenv'

loadEnvFile()

import './extensions/Guild'
import './extensions/GuildMember'

import { createServer } from 'http'
import { Client, Intents } from './structures'

createServer((_, response) => {
    response.write('Hello')
    response.end()
}).listen(process.env.PORT ?? 8080)


const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_WEBHOOKS
    ],
    restTimeOffset: 0,
    presence: {
        status: 'invisible'
    },
    failIfNotExists: false,
    allowedMentions: {
        repliedUser: false
    }
})


console.log(`Loaded a total of ${client.load('events')} events.`)
console.log(`Loaded a total of ${client.load('commands')} commands.`)

client.on('guildCreate', (guild) => void guild.members.fetch())


client
    .on('channelUpdate', (channel) => {
        if (channel.type !== 'DM') channel.guild.check('CHANNEL_UPDATE', channel.id)
    })
    .on('channelDelete', (channel) => {
        if (channel.type !== 'DM') channel.guild.check('CHANNEL_DELETE', channel.id)
    })
    .on('channelCreate', (channel) => channel.guild.check('CHANNEL_CREATE', channel.id))
    .on('guildBanAdd', (ban) => ban.guild.check('MEMBER_BAN_ADD'))
    .on('roleCreate', (role) => role.guild.check('ROLE_CREATE', role.id))
    .on('roleDelete', (role) => role.guild.check('ROLE_DELETE', role.id))
    .on('roleUpdate', (role) => role.guild.check('ROLE_UPDATE', role.id))
    .on('guildMemberRemove', (member) => member.guild.check('MEMBER_KICK', member.id))
    .on('webhookUpdate', (channel) => channel.guild.check('WEBHOOK_UPDATE'))

void client.login(process.env.DEBUG_TOKEN || process.env.TOKEN)

process
    .on('uncaughtException', (err) => console.error(err))
    .on('unhandledRejection', (err) => console.error(err))
    .on('warning', (err) => console.warn(err))