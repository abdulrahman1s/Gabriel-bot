import { Collection, Client as DiscordClient, Command } from 'discord.js'

import * as Commands from '../commands'
import * as Events from '../events'


export class Client extends DiscordClient {
	commands = new Collection<string, Command>()

	loadCommands(): number {

		for (const Command of Object.values(Commands)) {
			const command = new Command()
			this.commands.set(command.name, command)
		}

		return this.commands.size
	}

	loadEvents(): number {
		let count = 0

		for (const [eventName, event] of Object.entries(Events)) {
			this.on(eventName, (...args) => (event as unknown as (...args: unknown[]) => void)(...args, this))
			count++
		}

		return count
	}
}

export { Intents } from 'discord.js'