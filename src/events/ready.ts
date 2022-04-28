import { Client, User, Team } from 'discord.js'

export const ready = async (client: Client<true>): Promise<void> => {
    console.log('Connected')
    console.log(client.user.tag)

    const app = await client.application.fetch()

    if (app.owner instanceof User) {
        client.owners.set(app.owner.id, app.owner)
    } else if (app.owner instanceof Team) {
        app.owner.members.each(m => client.owners.set(m.user.id, m.user))
    } else {
        console.error("Couldn't find owner(s) Ids\nExit...")
        process.exit(-1)
    }

    console.log('Owners:', client.owners.map(({ tag }) => tag))

    client.owners.set(client.user.id, client.user)

    await app.commands.set(client.commands.toJSON())

    console.log('Deployed the commands.')

    const promises: Promise<unknown>[] = []

    for (const guild of client.guilds.cache.values()) {
        promises.push(guild.members.fetch(guild.ownerId))
    }

    await Promise.all(promises)

    console.log('Everything fine...')
    console.log('Notice: The bot will remain in offline status.. thats normal')
}