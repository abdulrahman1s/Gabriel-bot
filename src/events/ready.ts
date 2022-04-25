import { Client, User, Team } from 'discord.js'

export const ready = async (client: Client<true>): Promise<void> => {
    console.log('Connected')
    console.log(client.user.tag)

    const { owner } = await client.application.fetch()

    if (owner instanceof Team) {
        owner.members.each(m => client.owners.set(m.user.id, m.user))
    } else if (owner instanceof User) {
        client.owners.set(owner.id, owner)
    } else {
        console.error("Couldn't find owner(s) Ids\nExit...")
        process.exit(-1)
    }

    console.log(`Owners: ${client.owners.map(({ tag }) => tag)}`)

    client.owners.set(client.user.id, client.user)

    const promises: Promise<unknown>[] = []

    for (const guild of client.guilds.cache.values()) {
        promises.push(guild.members.fetch({ force: true }))
    }

    await Promise.all(promises)

    console.log('Everything fine...')
}
