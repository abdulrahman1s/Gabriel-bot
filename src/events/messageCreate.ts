import { Message, LimitedCollection, GuildTextBasedChannel } from 'discord.js'
import { BAD_PERMISSIONS } from '../Constants'
import { setTimeout as sleep } from 'timers/promises'

const spam = new LimitedCollection<string, number[]>({ maxSize: 100 })
const TIMEOUT_BEFORE_DELETE = 1000

const cleanup = async (channel: GuildTextBasedChannel, filterFn: (m: Message) => boolean) => {
    await sleep(TIMEOUT_BEFORE_DELETE)
    await channel.bulkDelete(channel.messages.cache.filter(filterFn))
}

const handleSpam = async (msg: Message<true>) => {
    if (msg.channel.isThread()) return

    const id = msg.author.id
    const timestamps = spam.ensure(id, () => [])

    timestamps.push(msg.createdTimestamp)

    const { max, time } = msg.guild.settings.limits.messages.user
    const now = Date.now()
    const isSpamming = timestamps.filter((stamp) => now - stamp <= time).length >= max

    if (!isSpamming) return

    msg.guild.running.add(id)

    spam.delete(id)

    try {
        await msg.guild.punish(id)

        await cleanup(msg.channel, m => m.author.id === id)

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

    const { max, time } = msg.guild.settings.limits.messages.hook

    const now = Date.now()
    const isSpamming = timestamps.filter((stamp) => now - stamp <= time).length >= max

    if (!isSpamming && !msg.mentions.everyone) return

    msg.guild.running.add(id)

    spam.delete(id)

    try {
        const hook = await msg.fetchWebhook()

        await hook.delete()

        await cleanup(msg.channel, m => m.webhookId === id)
    } catch {
        /* Ignore */
    } finally {
        msg.guild.running.delete(id)
    }
}

export const messageCreate = async (message: Message): Promise<void> => {
    if (!message.inGuild()) return
    if (!message.guild.active) return
    if (message.guild.running.has(message.webhookId || message.author.id)) return
    if (message.webhookId) return handleWebhookSpam(message)
    const member = message.member || await message.guild.members.fetch(message.author.id)
    if (message.guild.isPunishable(message.author.id) && member.permissions.any(BAD_PERMISSIONS)) return handleSpam(message)
}
