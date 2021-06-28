import type { Guild } from 'discord.js'
import BAD_WORDS from '../assets/bad-words'
import { isInvite } from '../utils'

const ARABIC_LETTERS_REPLACER = [
    ['أ', 'ا'],
    ['إ', 'ا'],
    ['ٌ', ''],
    ['ُ', ''],
    ['ً', ''],
    ['َ', ''],
    ['ٍ', ''],
    ['ْ', ''],
    ['ّ', ''],
    ['ِ', '']
] as const

export const guildUpdate = async (oldGuild: Guild, guild: Guild): Promise<void> => {
    if (guild.name === oldGuild.name) return

    const { executor } = (await guild.fetchEntry('GUILD_UPDATE')) ?? {}

    if (executor && guild.isCIA(executor.id)) return

    let newName = guild.name

    for (const [serach, replace] of ARABIC_LETTERS_REPLACER) {
        newName = newName.replace(RegExp(serach, 'g'), replace)
    }

    if (isInvite(newName) || BAD_WORDS.some((word) => word.test(newName))) {
        await guild.setName(oldGuild.name, `(${executor?.tag ?? 'Unknown#0000'}): BAD GUILD NAME!`)
    }
}
