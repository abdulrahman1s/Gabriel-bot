import { Client as DiscordClient, Collection, Command as BaseCommand, Snowflake, User } from 'discord.js'
import * as Commands from '../commands'
import * as Events from '../events'

export class Client extends DiscordClient {
    readonly commands = new Collection<string, BaseCommand>()
    readonly owners = new Collection<Snowflake, User>()
    sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

    load(type: 'commands' | 'events'): number {
        if (type === 'commands') {
            for (const Command of Object.values(Commands)) {
                const command = new Command() as BaseCommand
                this.commands.set(command.name, command)
            }

            return this.commands.size
        } else if (type === 'events') {
            let count = 0

            for (const [eventName, event] of Object.entries(Events)) {
                this.on(eventName, (...args) => (event as (...args: unknown[]) => void)(...args, this))
                count++
            }

            return count
        } else throw new TypeError('Invalid load type!')
    }
}

export { Intents } from 'discord.js'
