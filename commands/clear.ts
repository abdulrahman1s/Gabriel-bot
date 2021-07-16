import type { Message, Command } from 'discord.js'
import { percentage } from '../utils'

export class ClearCommand implements Command {
    name = 'clear'
    async run(message: Message): Promise<unknown> {
        const guild = message.guild!

        const [roles, channels, bots] = await Promise.all([
            guild.cleanup('roles'),
            guild.cleanup('channels'),
            guild.cleanup('bots')
        ])

        const output = [
            `Channels: \`${percentage(channels)}\``,
            `Roles: \`${percentage(roles)}\``,
            `Bots: \`${percentage(bots)}\``
        ].join('\n')

        return message.reply(output)
    }
}
