import type { GuildMember } from 'discord.js'
import config from '../config'

export const guildMemberUpdate = async (oldMember: GuildMember, member: GuildMember): Promise<void> => {
	if (member.roles.cache.size <= oldMember.roles.cache.size) return
	if (member.guild.isIgnored(member.id)) return

	const roles = member.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id))
	const log = await member.guild.fetchAudit('MEMBER_ROLE_UPDATE', member.id)

	if (log?.executor && member.guild.isIgnored(log.executor.id)) {
		return
	}

	const badRoles = roles.filter((role) => role.permissions.any(config.BAD_PERMISSIONS))

	if (badRoles.size) {
		await member.roles.remove(badRoles, `(${log?.executor?.tag ?? 'Unknown#0000'}): DON\'T GIVE ANYONE ROLE WITH THAT PERMISSIONs .-.`)
	}
}