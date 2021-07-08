import type { Message, Command } from 'discord.js'
import ms from 'ms'

export class UptimeCommand implements Command {
    name = 'uptime'
    async run(message: Message): Promise<unknown> {
        const uptime = ms(message.client.uptime!, { long: true })
        return message.reply(`Uptime: **${uptime}**`)
    }
}
