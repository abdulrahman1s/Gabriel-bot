import { GuildMember as BaseGuildMember } from 'discord.js'

class GuildMember extends BaseGuildMember {
    async dm(message: unknown, { times = 1 } = {}): Promise<boolean> {
        let i = 0

        const channel = await this.createDM().catch(() => null)

        if (!channel) return false

        while (i++ < times) {
            try {
                await channel.send(message as string)
            } catch {
                return false
            }
        }

        return true
    }
}

for (const [name, prop] of Object.entries(Object.getOwnPropertyDescriptors(GuildMember.prototype))) {
    Object.defineProperty(BaseGuildMember.prototype, name, prop)
}
