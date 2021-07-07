import type { Message, Command } from 'discord.js'

export class SayCommand implements Command {
    name = 'say'
    async run(message: Message, args: string[]): Promise<unknown> {
        await message.delete()
        return message.channel.send({
            content: args.join(' '),
            files: Array.from(message.attachments.values())
        })
    }
}
