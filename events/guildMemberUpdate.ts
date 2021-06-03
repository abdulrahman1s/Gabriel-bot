import type { GuildMember } from 'discord.js'
import { BAD_PERMISSIONS } from '../Constants'


export const guildMemberUpdate = async (oldMember: GuildMember, member: GuildMember): Promise<void> => {
	if (member.roles.cache.size <= oldMember.roles.cache.size) return
	if (member.guild.isIgnored(member.id)) return

	const rolesAdded = member.roles.cache.filter((role) => !oldMember.roles.cache.has(role.id))
	const { executor } = await member.guild.fetchAudit('MEMBER_ROLE_UPDATE', member.id) ?? {}

	if (executor && (executor.id === member.id || member.guild.isIgnored(executor.id))) {
		return
	}

	const badRoles = rolesAdded.filter((role) => role.permissions.any(BAD_PERMISSIONS))

	if (badRoles.size) {
		await member.roles.remove(badRoles, `(${executor?.tag ?? 'Unknown#0000'}): DON\'T GIVE ANYONE ROLE WITH THAT PERMISSIONS!`)
	}
}