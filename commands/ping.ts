import type { Message, Command } from 'discord.js'

export class PingCommand implements Command {
    name = 'ping'
    async run(message: Message): Promise<unknown> {
        const msg = await message.channel.send('Ping...')
        const ping = Math.abs(msg.createdTimestamp - message.createdTimestamp - message.client.ws.ping)
        return msg.edit(`Pong: \`${ping}ms\``)
    }
}
