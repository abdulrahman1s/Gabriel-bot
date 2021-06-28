import type { Message } from 'discord.js'
import config from '../config'

export const message = async (message: Message): Promise<void> => {
    if (!message.guild) return

    if (message.webhookID && !message.guild.isIgnored(message.channel.id)) {
        return void message.client.emit('webhookMessage', message)
    }

    if (!message.client.owners.has(message.author.id)) return

    if (message.content === config.CHECK_MESSAGE) {
        return void message.react('💯')
    }

    const prefix = message.content.match(RegExp(`^(<@!?${message.client.user!.id}>)\\s*`))?.[1]

    if (!prefix) return

    const [commandName, ...args] = message.content.slice(prefix.length).trim().split(/ +/)

    const command = message.client.commands.get(commandName)

    try {
        await command?.run(message, args)
    } catch (error) {
        console.error(error)
    }
}
