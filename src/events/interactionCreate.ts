import { Interaction, DiscordAPIError } from 'discord.js'
import { CommandError } from '../structures'

const ERROR_EMOJI = '⚠️ '

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
        const say = (content: string) => (ctx.replied || ctx.deferred) ?
            ctx.editReply(ERROR_EMOJI + content) :
            ctx.reply({ content: ERROR_EMOJI + content, ephemeral: true })

        if (err instanceof CommandError) {
            await say(err.message)
        } else if (err instanceof DiscordAPIError && err.code === 50013) {
            await say(`Sorry, I'm missing permissions to do that`)
        } else {
            console.error(err)
            await say('An error has occurred')
        }
    }
}