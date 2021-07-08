import type { Command, Message, MessageOptions } from 'discord.js'

export class SayCommand implements Command {
    name = 'say'
    async run(message: Message): Promise<unknown> {
        await message.delete()

        const options: MessageOptions = {
            content: message.content,
            files: Array.from(message.attachments.values()),
            allowedMentions: { 
                parse: ['roles', 'users']
            }
        }

        const messageReference = message.reference?.messageId

        if (messageReference) options.reply = {
            messageReference,
            failIfNotExists: false
        }

        return message.channel.send(options)
    }
}
