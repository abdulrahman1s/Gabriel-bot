import type { Command, CTX } from '../structures'
import ms from 'ms'

export class Uptime implements Command {
    name = 'uptime'
    description = 'Shows bot uptime'
    async run(ctx: CTX): Promise<void> {
        const uptime = ms(ctx.client.uptime!, { long: true })
        await ctx.reply(`Uptime: **${uptime}**`)
    }
}
