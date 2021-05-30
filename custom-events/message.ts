import type { Message } from 'discord.js'
import ms from 'ms'
import config from '../config'

const cache = new Map<string, number[]>()

setInterval(() => cache.clear(), ms('1 hour'))

export const message = async (message: Message): Promise<void> => {
	if (!message.guild) return

	if (message.author.id === message.guild.ownerID && message.content === config.CHECK_MESSAGE) { 
		message.react('💯')
			.then((reacted) => {
				message.client.setTimeout(() => reacted.remove().catch(() => null), ms('5 seconds'))
			})
	}

	if (!message.webhookID) return
	if (message.guild.isIgnored(message.channel.id)) return
	if (message.guild.running.has(message.webhookID)) return

	if (!cache.has(message.webhookID)) cache.set(message.webhookID, [])

	cache.get(message.webhookID)!.push(message.createdTimestamp)

	const isSpamming = cache.get(message.webhookID)!.filter((timestamp) => Date.now() - timestamp <= 3000).length >= 5

	if (isSpamming || message.mentions.everyone) {
		message.guild.running.add(message.webhookID)

		try {
			const hook = await message.fetchWebhook()

			await hook.delete('Anti-raid')

			cache.delete(message.webhookID)

			await message.guild.owner?.dm('Deleted Hook')
		} catch (e) {
			console.error(e)
		} finally {
			message.guild.running.delete(message.webhookID)
		}
	}
}