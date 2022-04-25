import type { Guild } from 'discord.js'
import { BAD_WORDS } from '../Constants'
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
].map(([search, replace]) => [RegExp(search, 'g'), replace]) as [RegExp, string][]

export const guildUpdate = async (oldGuild: Guild, guild: Guild): Promise<void> => {
    if (guild.defaultMessageNotifications === 'ALL_MESSAGES') {
        await guild.setDefaultMessageNotifications('ONLY_MENTIONS', 'Auto disable all-messages notifications mode').catch(() => null)
    }

    if (guild.name === oldGuild.name) return

    const { executor } = (await guild.fetchEntry('GUILD_UPDATE')) ?? {}

    if (executor && !guild.client.isPunishable(executor.id)) return

    let name = guild.name

    // Clean up special arabic letters
    for (const args of ARABIC_LETTERS_REPLACER) name = name.replace(...args)

    let has = false

    if (isInvite(name)) has = true
    else for (const word of name.split(' ')) if (BAD_WORDS.includes(word.toLowerCase())) {
        has = true
        break
    }

    if (has) {
        await guild.setName(oldGuild.name, `(${executor?.tag ?? 'Unknown#0000'}): Detected bad name`)
        if (executor) await guild.punish(executor.id)
    }
}
