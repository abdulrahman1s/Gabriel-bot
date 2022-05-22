import { ChatInputApplicationCommandData, ApplicationCommandSubCommandData, CommandInteraction, PermissionResolvable } from 'discord.js'


export interface Command extends ChatInputApplicationCommandData {
    permissions?: PermissionResolvable
    run(ctx: CommandInteraction): Awaited<void | unknown>
}

export interface SubCommand extends ApplicationCommandSubCommandData {
    run(ctx: CommandInteraction): Awaited<void | unknown>
}

export class CommandError {
    constructor(public message: string) {}
}

export type CTX = CommandInteraction<'cached'>