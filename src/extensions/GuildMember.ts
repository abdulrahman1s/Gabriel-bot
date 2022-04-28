import { GuildMember } from 'discord.js'
import config from '../config'

GuildMember.prototype.dm = async function (content: string, times = 1) {
    if (!config.directAlerts) return false

    let i = 0

    const channel = await this.createDM(false).catch(() => null)

    if (!channel) return false

    while (i++ < times) {
        try {
            await channel.send(content)
        } catch {
            return false
        }
    }

    return true
}