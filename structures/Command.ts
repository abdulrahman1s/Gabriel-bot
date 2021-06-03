import type { Message } from 'discord.js'

export abstract class Command {
	abstract name: string
	abstract run(message: Message, args: string[]): Promise<unknown|void> | void
}