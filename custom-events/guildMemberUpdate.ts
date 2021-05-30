import type { GuildMember } from 'discord.js'
import config from '../config'

export const guildMemberUpdate = async (oldMember: GuildMember, member: GuildMember): Promise<void> => {
	if (member.roles.cache.size <= oldMember.roles.cache.size) return
	if (member.guild.isIgnored(member.id)) return

	const roles = member.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id))
	const log = await member.guild.fetchAudit('MEMBER_ROLE_UPDATE', member.id)

	for (const role of roles.values()) {
		if (role.permissions.any(config.BAD_PERMISSIONS)) {
			if (log?.executor) {
				if (!role.guild.isIgnored(log.executor.id)) {
					await member.roles.remove(role.id, `(${log.executor.tag}): DON\'T GIVE ANYONE ROLE WITH THAT PERMISSIONs .-.`).catch(() => null)
				}
			} else {
				await member.roles.remove(role.id, `(Unknown#0000): DON\'T GIVE ANYONE ROLE WITH THAT PERMISSIONs .-.`).catch(() => null)
			}
		}
	}
}