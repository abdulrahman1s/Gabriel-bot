import { CTX, Command } from '../structures'
import { SnowflakeUtil } from 'discord.js'

export class Ping implements Command {
    name = 'ping'
    description = 'Pong?'
    async run(ctx: CTX): Promise<void> {
        const msg = await ctx.reply({ content: '**Ping...**', fetchReply: true, ephemeral: true })        
        const ping = Math.abs((SnowflakeUtil.timestampFrom(msg.id) - ctx.createdTimestamp) - ctx.client.ws.ping)
        await ctx.editReply(`Pong: \`${ping}ms\``)
    }
}
