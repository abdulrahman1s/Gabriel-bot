import type { Client } from 'discord.js'
import { User, Team } from 'discord.js'

export const ready = async (client: Client): Promise<void> => {
    console.log('Connected')
    console.log(client.user!.tag)

    const application = await client.application!.fetch()
    const owner = application.owner

    if (!owner) {
        console.error("Couldn't find owner(s) Ids\nExit...")
        process.exit(-1)
    } else if (owner instanceof User) {
        client.owners.set(owner.id, owner)
    } else if (owner instanceof Team) {
        for (const { user } of owner.members.values()) client.owners.set(user.id, user)
    }

    console.log(`const owners = [ \n${client.owners.map((owner) => owner.tag).join(',\n')}\n ]`)

    const promises: Promise<unknown>[] = []

    for (const guild of client.guilds.cache.values()) {
        promises.push(guild.members.fetch())
    }

    await Promise.all(promises)

    console.log('Everything fine...')
}
