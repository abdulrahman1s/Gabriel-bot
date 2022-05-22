import type { Guild } from 'discord.js'
import { inviteRegExp } from '../utils'

export const guildUpdate = async (oldGuild: Guild, guild: Guild): Promise<void> => {
    if (!guild.active) return

    if (guild.defaultMessageNotifications === 'ALL_MESSAGES') {
        await guild.setDefaultMessageNotifications('ONLY_MENTIONS', 'All Messages cannot be enabled').catch(() => null)
    }

    if (guild.name === oldGuild.name || !inviteRegExp.test(guild.name)) return

    const executor = await guild.fetchExecutor('GUILD_UPDATE')

    if (executor && !guild.isPunishable(executor.id)) return

    await guild.setName(oldGuild.name, `(${executor?.tag ?? 'Unknown#0000'}): This name cantinas an invite`)
    
    if (executor) await guild.punish(executor.id)
}
