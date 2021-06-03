import { Collection, Client as DiscordClient } from 'discord.js'
import type { Command } from '.'

export class Client extends DiscordClient {
	commands = new Collection<string, Command>()
}

export { Intents } from 'discord.js'