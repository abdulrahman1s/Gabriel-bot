import type { GuildMember } from 'discord.js'
import { BAD_PERMISSIONS } from '../Constants'

export const guildMemberUpdate = async (oldMember: GuildMember, member: GuildMember): Promise<void> => {
    if (!member.client.isPunishable(member.id)) return
    if (member.roles.cache.size <= oldMember.roles.cache.size) return

    const oldRoles = oldMember.roles.cache
    const badRoles = member.roles.cache.filter((role) => !oldRoles.has(role.id) && role.permissions.any(BAD_PERMISSIONS))

    if (badRoles.size === 0) return

    const { executor } = (await member.guild.fetchEntry('MEMBER_ROLE_UPDATE', member.id)) ?? {}

    if (executor && (executor.id === member.id || !member.client.isPunishable(executor.id))) {
        return
    }

    const reason = `(${executor?.tag ?? 'Unknown#0000'}): DON'T GIVE ANYONE ROLE WITH THAT PERMISSIONS!`

    await member.roles.remove(badRoles, reason)
}
