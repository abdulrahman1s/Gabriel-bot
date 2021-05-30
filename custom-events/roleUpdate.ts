import type { Role } from 'discord.js'
import config from '../config'

export const roleUpdate = async (oldRole: Role, role: Role): Promise<void> => {
	if (role.permissions.equals(oldRole.permissions)) return
	if (role.tags?.botID && role.guild.isIgnored(role.tags.botID)) return

	const log = await role.guild.fetchAudit('ROLE_UPDATE', role.id)

	if (log?.executor) {
		if (role.guild.isIgnored(log.executor.id)) {
			if (role.isEveryone && role.permissions.any(config.BAD_PERMISSIONS)) {
				role.guild.owner?.dm(`**${log.executor.tag}** GIVING @everyone BAD PERMISSIONS!!`)
				await role.setPermissions(role.permissions.freeze().remove(config.BAD_PERMISSIONS), `(${log.executor.tag}): DON'T GIVE @everyone BAD PERMISSIONS!`)
			}
		} else {
			if (role.permissions.any(config.BAD_PERMISSIONS)) {
				await role.setPermissions(role.permissions.freeze().remove(config.BAD_PERMISSIONS), `(${log.executor.tag}): DON'T GIVE ANY @ROLE BAD PERMISSIONS!`)
			}
		}
	} else {
		await role.setPermissions(role.permissions.freeze().remove(config.BAD_PERMISSIONS))
	}
}