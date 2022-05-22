import type { Guild } from 'discord.js'

export const guildCreate = async (guild: Guild) => {
    await guild.setup()
}