import { Message, LimitedCollection } from 'discord.js'
import { BAD_PERMISSIONS } from '../Constants'
import { isInvite } from '../utils'
import config from '../config'

const spam = new LimitedCollection<string, number[]>({ maxSize: 100 })

const handleSpam = async (msg: Message<true>) => {
    if (msg.channel.isThread()) return

    const id = msg.author.id
    const timestamps = spam.ensure(id, () => [])

    timestamps.push(msg.createdTimestamp)


    const now = Date.now()
    const isSpamming = timestamps.filter((stamp) => now - stamp <= config.limits.messages.user.time).length >= config.limits.messages.user.max

    if (!isSpamming) return

    msg.guild.running.add(id)

    spam.delete(id)

    try {
        await msg.guild.punish(id)

        const spamMessages = msg.channel.messages.cache.filter(m => m.webhookId === id)

        await msg.channel.bulkDelete(spamMessages)

        if (msg.channel.type === 'GUILD_TEXT') await msg.channel.setRateLimitPerUser(5)
    } catch {
        /* Ignore */
    } finally {
        msg.guild.running.delete(id)
    }
}

const handleWebhookSpam = async (msg: Message<true>) => {
    const id = msg.webhookId!

    const timestamps = spam.ensure(id, () => [])

    timestamps.push(msg.createdTimestamp)

    const now = Date.now()
    const isSpamming = timestamps.filter((stamp) => now - stamp <= config.limits.messages.hook.time).length >= config.limits.messages.hook.max

    if (!(isSpamming || msg.mentions.everyone)) return

    msg.guild.running.add(id)

    spam.delete(id)

    try {
        const hook = await msg.fetchWebhook()

        await hook.delete()

        const spamMessages = msg.channel.messages.cache.filter(m => m.webhookId === id)

        await msg.channel.bulkDelete(spamMessages)
    } catch {
        /* Ignore */
    } finally {
        msg.guild.running.delete(id)
    }
}

export const messageCreate = async (message: Message): Promise<void> => {
    if (!message.inGuild()) return
    if (message.guild.running.has(message.webhookId || message.author.id)) return
    if (message.webhookId) return handleWebhookSpam(message)
    if ((message.mentions.everyone || isInvite(message.content)) && message.member?.permissions.any(BAD_PERMISSIONS)) {
        return handleSpam(message)
    }
}
