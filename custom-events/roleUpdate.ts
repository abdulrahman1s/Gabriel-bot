import type { Role } from 'discord.js'
import config from '../config'

export const roleUpdate = async (oldRole: Role, role: Role): Promise<void> => {
	if (role.permissions.bitfield === oldRole.permissions.bitfield) return
	if (role.tags?.botID && role.guild.isIgnored(role.tags.botID)) return

	const log = await role.guild.fetchAudit('ROLE_UPDATE', role.id)

	if (log?.executor) {
		if (config.WHITE_LIST.includes(log.executor.id)) {
			if (role.isEveryone && role.permissions.any(config.BAD_PERMISSIONS)) {
				role.guild.owner?.send(`**${log.executor.tag}** GIVING @everyone BAD PERMISSIONS!!`).catch(() => null)
				await role.setPermissions(role.permissions.remove(config.BAD_PERMISSIONS), 'DON\'T GIVE @everyone BAD PERMISSIONS!').catch(() => null)
			}
		} else {
			if (role.permissions.any(config.BAD_PERMISSIONS)) {
				await role.setPermissions(role.permissions.remove(config.BAD_PERMISSIONS), 'DON\'T GIVE ANY @ROLE BAD PERMISSIONS!').catch(() => null)
			}
		}
	} else {
		await role.setPermissions(role.permissions.remove(config.BAD_PERMISSIONS)).catch(() => null)
	}
}