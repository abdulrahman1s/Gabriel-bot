import { Interaction } from 'discord.js'

export const interactionCreate = async (ctx: Interaction) => {
    if (!ctx.isCommand() || !ctx.inGuild()) return
    
    const command = ctx.client.commands.get(ctx.commandName)

    if (!command) return

    try {
        await command.run(ctx)
    } catch (err) {
        console.error(err)
        const say = (content: string) => (ctx.replied || ctx.deferred) ? ctx.editReply(content) : ctx.reply(content)
        await say('An error has occurred')
    }
}