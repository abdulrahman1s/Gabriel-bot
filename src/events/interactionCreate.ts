import type { Interaction } from 'discord.js'

export const interactionCreate = async (ctx: Interaction) => {
    if (!ctx.isCommand() || !ctx.inGuild()) return
    if (!ctx.guild!.active) return

    const command = ctx.client.commands.get(ctx.commandName)

    if (!command) return

    if (command.permissions && !ctx.memberPermissions.has(command.permissions)) return ctx.reply({
        content: 'You don\'t have the required permissions.',
        ephemeral: true
    })

    try {
        await command.run(ctx)
    } catch (err) {
        console.error(err)
        const say = (content: string) => (ctx.replied || ctx.deferred) ? ctx.editReply(content) : ctx.reply({ content, ephemeral: true })
        await say('An error has occurred')
    }
}