import type { Client } from 'discord.js'
import { Snapshot } from '../structures/Snapshot'
import ms from 'ms'

export const ready = async (client: Client<true>): Promise<void> => {
    console.log('Connected')
    console.log(client.user.tag)

    await client.application.commands.set(client.commands.toJSON())

    console.log('Deployed the commands.')

    const promises: Promise<unknown>[] = []

    for (const guild of client.guilds.cache.values()) promises.push(guild.setup())

    await Promise.all(promises)

    setInterval(() => client.guilds.cache.each((guild) => {
        if (guild.active && guild.settings.snapshots.enabled) guild.snapshot = new Snapshot(guild)
    }), ms('1 hour'))

    console.log('Everything fine...')
}
