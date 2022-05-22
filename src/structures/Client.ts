import { Client as DiscordClient, Collection } from 'discord.js'
import { Command } from '.'

import * as commands from '../commands'
import * as events from '../events'

export class Client extends DiscordClient {
    readonly commands = new Collection<string, Command>()

    loadEvents(): number {
        let i = 0
        for (const args of Object.entries(events)) super.on(...args) && i++
        return i
    }

    loadCommands(): number {
        for (const Command of Object.values(commands)) {
            const command = new Command()
            this.commands.set(command.name, command)
        }

        return this.commands.size
    }
}

export { Intents } from 'discord.js'
