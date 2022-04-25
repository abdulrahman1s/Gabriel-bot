import { Client as DiscordClient, Collection, Snowflake, User } from 'discord.js'
import { Command } from '.'
import config from '../config'

import * as commands from '../commands'
import * as events from '../events'


export class Client extends DiscordClient {
    readonly commands = new Collection<string, Command>()
    readonly owners = new Collection<Snowflake, User>()

    isPunishable(targetId: string): boolean {
        return !this.owners.has(targetId) && !config.ignoredIds.includes(targetId)
    }

    loadEvents(): number {
        let i = 0
        for (const args of Object.entries(events)) this.on(...args) && i++
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
