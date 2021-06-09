import type { Message } from 'discord.js'
import { LIMITS } from '../Constants'
import config from '../config'
import ms from 'ms'

const cache = new Map<string, number[]>()

setInterval(() => cache.clear(), ms('1 hour'))

const checker = async (message: Message): Promise<void> => {
	if (!message.guild) return
	if (message.author.id === message.guild.ownerID && message.content === config.CHECK_MESSAGE) { 
		const reacted = await message.react('💯')
		message.client.setTimeout(() => reacted.remove().catch(() => null), ms('5 seconds'))
	}
}

const hook = async (message: Message): Promise<void> => {
	if (!message.guild) return
	if (!message.webhookID || message.guild.isIgnored(message.channel.id)) return

	const timestamps = cache.get(message.webhookID) ?? cache.set(message.webhookID, []).get(message.webhookID)!

	timestamps.push(message.createdTimestamp)

	if (message.guild.running.has(message.webhookID)) return

	const isSpamming = timestamps.filter((timestamp) => Date.now() - timestamp <= LIMITS.HOOK.TIME).length >= LIMITS.HOOK.MAX

	if (isSpamming || message.mentions.everyone) {
		message.guild.running.add(message.webhookID)

		try {
			const hook = await message.fetchWebhook()

			await hook.delete('Anti-raid')

			cache.delete(message.webhookID)
			
			message.guild.owner?.dm('Deleted Hook')
		} catch {
			/* Nothing */
		} finally {
			message.guild.running.delete(message.webhookID)
		}
	}
}

const commandProcess = async (message: Message): Promise<void> => {
	if (message.author.bot || !message.guild) return
	if (message.author.id !== message.guild.ownerID) return

	const prefix = message.content.match(new RegExp(`^(<@!?${message.client.user!.id}>)\\s*`))?.[1]

	if (!prefix) return

	const [commandName, ...args] = message.content.slice(prefix.length).trim().split(/ +/)

	const command = message.client.commands.get(commandName)

	try {
		await command?.run(message, args)
	} catch (error) {
		console.error(error)
	}
}


export const message = (message: Message) => Promise.all([
	checker(message),
	hook(message),
	commandProcess(message)
])