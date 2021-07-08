import type { Message, Command } from 'discord.js'

export class SayCommand implements Command {
    name = 'say'
    async run(message: Message): Promise<unknown> {
        await message.delete()
        return message.channel.send({
            content: message.content,
            files: Array.from(message.attachments.values())
        })
    }
}
