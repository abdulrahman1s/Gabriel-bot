import type { Message } from 'discord.js'
import ms from 'ms'

const cache = new Map<string, number[]>()

setInterval(() => cache.clear(), ms('1 hour'))

export const message = async (message: Message): Promise<void> => {
	if (!message.guild || !message.webhookID) return
	if (message.guild.isIgnored(message.channel.id)) return

	if (!cache.has(message.webhookID)) cache.set(message.webhookID, [])

	cache.get(message.webhookID)!.push(message.createdTimestamp)

	const spamMatches = cache.get(message.webhookID)!.filter((timestamp) => (Date.now() - timestamp) <= 3000)

	if (spamMatches.length >= 5 || message.mentions.everyone) {
		message.fetchWebhook()
			.then((hook) => hook.delete('Anti-raid'))
			.then(() => void message.guild!.owner?.send('Deleted Hook'))
			.catch(() => null)
	}
}