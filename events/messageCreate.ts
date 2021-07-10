import type { Message } from 'discord.js'
import config from '../config'
import { BAD_PERMISSIONS } from '../Constants'
import { isInvite } from '../utils'

export const messageCreate = async (message: Message): Promise<void> => {
    if (!message.guild || message.channel.type === 'DM') return

    if (message.webhookId || message.mentions.everyone || isInvite(message.content)) {
        if (message.webhookId || message.member?.permissions.any(BAD_PERMISSIONS)) {
            message.client.emit('detectSpam', message)
        }
    }

    if (message.author.bot || !message.client.owners.has(message.author.id)) return

    if (message.content === config.CHECK_MESSAGE) {
        return void message.react('💯')
    }

    const prefix = message.content.match(RegExp(`^(<@!?${message.client.user!.id}>)\\s*`))?.[1]

    if (!prefix) return

    const [commandName, ...args] = message.content.slice(prefix.length).trim().split(/ +/)

    const command = message.client.commands.get(commandName)

    if (!command) return

    message.content = args.join(' ')

    try {
        await command.run(message)
    } catch (error) {
        console.error(error)
    }
}
