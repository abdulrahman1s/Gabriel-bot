import type { Role } from 'discord.js'
import { BAD_PERMISSIONS } from '../Constants'

export const roleUpdate = async (oldRole: Role, role: Role): Promise<void> => {
	if (role.permissions.equals(oldRole.permissions)) return
	if (role.tags?.botID && role.guild.isIgnored(role.tags.botID)) return

	if (!role.permissions.any(BAD_PERMISSIONS)) return
	
	const { executor } = await role.guild.fetchAudit('ROLE_UPDATE', role.id) ?? {}
	const isEveryone = role.id === role.guild.id

	if (isEveryone) {
		role.guild.owner?.dm(`**${executor?.tag ?? 'Unknown#0000'}** GIVING @everyone BAD PERMISSIONS!!`)
	} else if (executor && role.guild.isIgnored(executor.id)) {
		return
	}
		
	await role.setPermissions(role.permissions.remove(BAD_PERMISSIONS), `(${executor?.tag ?? 'Unknown#0000'}): DON'T GIVE ANY @ROLE BAD PERMISSIONS!`)
}