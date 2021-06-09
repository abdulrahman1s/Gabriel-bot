import type { Message, Command } from 'discord.js'

export class ClearCommand implements Command {
	name = 'clear'
	run(message: Message): Promise<unknown> {
		const cacheSize = message.guild!.actions.cache.size
		message.guild!.actions.cache.clear()
		return message.reply(`Cache cleared: \`${cacheSize}\`.`)
	}
}