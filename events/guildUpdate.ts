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
    if (guild.defaultMessageNotifications !== oldGuild.defaultMessageNotifications) {
        if (guild.defaultMessageNotifications === 'ALL_MESSAGES') {
            return void guild.setDefaultMessageNotifications('ONLY_MENTIONS', 'All Messages? R U KIDDING ME?')
        }
    }

    if (guild.name === oldGuild.name) return

    const { executor } = (await guild.fetchEntry('GUILD_UPDATE')) ?? {}

    if (executor && guild.isCIA(executor.id)) return

    let name = guild.name

    for (const [serach, replace] of ARABIC_LETTERS_REPLACER) {
        name = name.replace(RegExp(serach, 'g'), replace)
    }

    if (isInvite(name) || BAD_WORDS.some((word) => word.test(name))) {
        await guild.setName(oldGuild.name, `(${executor?.tag ?? 'Unknown#0000'}): BAD GUILD NAME!`)

        if (executor) {
            const botRole = guild.roles.botRoleFor(executor.id)
            await Promise.all([
                await guild.members.edit(executor.id, { roles: botRole ? [botRole] : [] }),
                botRole?.setPermissions(0n)
            ])
        }
    }
}
