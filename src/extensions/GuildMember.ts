import { GuildMember } from 'discord.js'

GuildMember.prototype.dm = async function (message: unknown, times = 1) {
    let i = 0

    const channel = await this.createDM(false).catch(() => null)

    if (!channel) return false

    while (i++ < times) {
        try {
            await channel.send(String(message))
        } catch {
            return false
        }
    }

    return true
}