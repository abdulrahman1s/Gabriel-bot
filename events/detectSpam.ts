import { LimitedCollection, Message, Permissions, Snowflake } from 'discord.js'
import { LIMITS } from '../Constants'

const cache = new LimitedCollection<Snowflake, number[]>(100)

export const detectSpam = async (message: Message): Promise<void> => {
    if (!message.guild || message.channel.type === 'DM' || message.channel.isThread()) return

    const isWebhook = !!message.webhookId

    if (!isWebhook && message.guild.isCIA(message.author.id)) return
    if (isWebhook && !message.mentions.everyone && message.guild.isIgnored(message.channel.id)) return

    const id = message.webhookId ?? message.author.id
    const LIMIT = isWebhook ? LIMITS.HOOK : LIMITS.SPAM
    const timestamps = cache.get(id) ?? cache.set(id, []).get(id)!

    timestamps.push(message.createdTimestamp)

    if (message.guild.running.has(id)) return

    const now = Date.now()

    const isSpamming = timestamps.filter((timestamp) => now - timestamp <= LIMIT.TIME).length >= LIMIT.MAX

    if (isSpamming || (isWebhook && message.mentions.everyone)) {
        cache.delete(id)

        message.guild.running.add(id)

        try {
            if (isWebhook) {
                await message.fetchWebhook().then((hook) => hook.delete())
            } else {
                await message.guild.punish(id)

                const overwrites = [
                    {
                        id: message.guild.id,
                        type: 'role' as const,
                        deny: [
                            Permissions.FLAGS.MENTION_EVERYONE,
                            Permissions.FLAGS.MANAGE_WEBHOOKS,
                            Permissions.FLAGS.MANAGE_MESSAGES,
                            Permissions.FLAGS.MANAGE_CHANNELS
                        ]
                    }
                ]

                const muteRole = message.guild.roles.cache.find((role) => role.name === 'Muted')

                if (muteRole) {
                    overwrites.push({
                        id: muteRole.id,
                        type: 'role',
                        deny: [Permissions.FLAGS.SEND_MESSAGES]
                    })
                }

                await message.channel.permissionOverwrites.set(overwrites)

                if (message.channel.type === 'GUILD_TEXT') await message.channel.setRateLimitPerUser(15)
            }
        } catch {
            /* Nothing */
        } finally {
            const spam = message.channel.messages.cache.filter((m) => id === (isWebhook ? m.webhookId : m.author.id))

            await message.channel.bulkDelete(spam).catch(() => null)

            message.guild.running.delete(id)
        }
    }
}
