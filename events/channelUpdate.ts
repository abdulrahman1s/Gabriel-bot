import type { GuildChannel, PermissionString, PermissionObject } from 'discord.js'
import { Permissions } from 'discord.js'
import { BAD_PERMISSIONS, BAD_PERMISSIONS_OBJECT } from '../Constants'
const BAD_PERMISSIONS_STRING = Object.keys(BAD_PERMISSIONS_OBJECT) as PermissionString[]


const overwriteSerializer = ({ allow = 0n, deny = 0n }): PermissionObject => {
	const permissions = <{ [key in PermissionString]: boolean }>{}

	for (const permission of Object.keys(Permissions.FLAGS) as PermissionString[]) {
		if (allow & Permissions.FLAGS[permission]) {
			permissions[permission] = true
		} else if (deny & Permissions.FLAGS[permission]) {
			permissions[permission] = false
		}
	}

	return permissions
}

export const channelUpdate = async (oldChannel: GuildChannel, channel: GuildChannel): Promise<void> => {
	if (!channel.guild) return

	const addedOverwrites = channel.permissionOverwrites
		.filter((overwrite) => !oldChannel.permissionOverwrites.has(overwrite.id) && overwrite.allow.any(BAD_PERMISSIONS))
		.filter(({ id }) => !channel.guild.isIgnored(id))

	const updatedOverwrites = channel.permissionOverwrites.filter((overwrite) => {
		const oldOverwrite = oldChannel.permissionOverwrites.get(overwrite.id)
		if (!oldOverwrite || overwrite.allow.equals(oldOverwrite.allow)) return false
		return overwrite.allow.remove(oldOverwrite.allow).any(BAD_PERMISSIONS)		 		
	}).filter(({ id }) => !channel.guild.isIgnored(id))


	const auditType = addedOverwrites.size
		? 'CHANNEL_OVERWRITE_CREATE' 
		: updatedOverwrites.size 
			? 'CHANNEL_OVERWRITE_UPDATE' 
			: null

	if (!auditType) return

	const { executor } = await channel.guild.fetchAudit(auditType, channel.id) ?? {}

	if (executor && channel.guild.isIgnored(executor.id)) {
		return
	}

	if (addedOverwrites.size) {
		await Promise.allSettled(addedOverwrites.map((overwrite) => overwrite.delete(`(${executor?.tag ?? 'Unknown#0000'}): DETECT BAD PERMISSIONS!`)))
	}

	if (updatedOverwrites.size) {
		await Promise.allSettled(updatedOverwrites.map((overwrite) => {
			const permissions = overwriteSerializer({
				allow: overwrite.allow.bitfield,
				deny: overwrite.deny.bitfield
			})

			for (const bad of BAD_PERMISSIONS_STRING) {
				if (permissions[bad]) permissions[bad] = false
			}

			return overwrite.update(permissions, `(${executor?.tag ?? 'Unknown#0000'}): DETECT BAD PERMISSIONS!`)
		}))
	}
}