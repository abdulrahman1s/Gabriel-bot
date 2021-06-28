import { Message } from 'discord.js'
import { LIMITS } from '../Constants'
import ms from 'ms'

const cache = new Map<string, number[]>()

setInterval(() => cache.clear(), ms('1 hour'))

export const webhookMessage = async (message: Message): Promise<void> => {
    if (!message.guild) return
    if (!message.webhookID || message.guild.isIgnored(message.channel.id)) return

    const timestamps = cache.get(message.webhookID) ?? cache.set(message.webhookID, []).get(message.webhookID)!

    timestamps.push(message.createdTimestamp)

    if (message.guild.running.has(message.webhookID)) return

    const isSpamming =
        timestamps.filter((timestamp) => Date.now() - timestamp <= LIMITS.HOOK.TIME).length >= LIMITS.HOOK.MAX

    if (isSpamming || message.mentions.everyone) {
        message.guild.running.add(message.webhookID)

        try {
            await message.fetchWebhook().then((hook) => hook.delete())

            cache.delete(message.webhookID)

            message.guild.owner?.dm('Deleted Hook')
        } catch {
            /* Nothing */
        } finally {
            message.guild.running.delete(message.webhookID)
        }
    }
}
