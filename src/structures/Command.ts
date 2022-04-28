import { ChatInputApplicationCommandData, CommandInteraction } from 'discord.js'

export interface Command extends ChatInputApplicationCommandData {
    run(ctx: CommandInteraction): Awaited<void | unknown>
}

export { CommandInteraction as CTX } from 'discord.js'