import type { Role } from 'discord.js'
import config from '../config'

export const roleUpdate = async (oldRole: Role, role: Role): Promise<void> => {
	if (role.permissions.equals(oldRole.permissions)) return
	if (role.tags?.botID && role.guild.isIgnored(role.tags.botID)) return

	const log = await role.guild.fetchAudit('ROLE_UPDATE', role.id)
	const isEveryone = role.id === role.guild.id

	if (role.permissions.any(config.BAD_PERMISSIONS)) {

		if (isEveryone) {
			role.guild.owner?.dm(`**${log?.executor?.tag ?? 'Unknown#0000'}** GIVING @everyone BAD PERMISSIONS!!`)
		} else if (log?.executor && role.guild.isIgnored(log.executor.id)) {
			return
		}
		
		await role.setPermissions(role.permissions.freeze().remove(config.BAD_PERMISSIONS), `(${log?.executor?.tag ?? 'Unknown#0000'}): DON'T GIVE ANY @ROLE BAD PERMISSIONS!`)
	}
}