import type { Message, Command, Client } from 'discord.js'
import ms from 'ms'

export class UptimeCommand implements Command {
    name = 'uptime'
    async run(message: Message): Promise<unknown> {
        const client = message.client as Client<true>
        const uptime = ms(client.uptime, { long: true })
        return message.reply(`Uptime: **${uptime}**`)
    }
}
