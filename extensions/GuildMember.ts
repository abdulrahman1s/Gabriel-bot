import { Structures } from 'discord.js'

class GuildMember extends Structures.get('GuildMember') {
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

Structures.extend('GuildMember', () => GuildMember)
