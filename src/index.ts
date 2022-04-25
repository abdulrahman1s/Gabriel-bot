import 'dotenv/config'
import './extensions'
import { createServer } from 'http'
import { Client, Intents } from './structures'
import config from './config'

createServer((_, response) => {
    response.end('Pong')
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
    }
})

console.log(`Loaded a total of ${client.loadEvents()} events.`)
console.log(`Loaded a total of ${client.loadCommands()} commands.`)

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

void client.login(config.token)

process
    .on('uncaughtException', (err) => console.error(err))
    .on('unhandledRejection', (err) => console.error(err))
    .on('warning', (err) => console.warn(err))