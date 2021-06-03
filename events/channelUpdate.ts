import type { GuildChannel, PermissionString, PermissionObject } from 'discord.js'
import { Permissions } from 'discord.js'
import { BAD_PERMISSIONS_STRING, BAD_PERMISSIONS } from '../Constants'

const overwriteSerializer = ({ allow = 0n, deny = 0n }): PermissionObject => {
	const json = <{ [key in PermissionString]: boolean }>{}

	for (const permission of Object.keys(Permissions.FLAGS) as PermissionString[]) {
		if (allow & Permissions.FLAGS[permission]) {
			json[permission] = true
		} else if (deny & Permissions.FLAGS[permission]) {
			json[permission] = false
		}
	}

	return json
}

export const channelUpdate = async (oldChannel: GuildChannel, channel: GuildChannel): Promise<void> => {
	if (!channel.guild) return

	const oldPermissionOverwrites = oldChannel.permissionOverwrites
	const permissionOverwrites = channel.permissionOverwrites


	const addedOverwrites = permissionOverwrites
		.filter((overwrite) => !oldPermissionOverwrites.has(overwrite.id) && overwrite.allow.any(BAD_PERMISSIONS))
		.filter((overwrite) => !channel.guild.isCIA(overwrite.id))

	const updatedOverwrites = permissionOverwrites.map((newOverwrite) => [newOverwrite, oldPermissionOverwrites.get(newOverwrite.id)])
		.filter(([overwrite, oldOverwrite]) => oldOverwrite && !(overwrite?.allow.equals(oldOverwrite.allow) && overwrite?.deny.equals(oldOverwrite.deny)))
		.filter(([overwrite, oldOverwrite]) => overwrite!.allow.freeze().remove(oldOverwrite!.allow).any(BAD_PERMISSIONS))
		.map(([overwrite]) => overwrite)
		.filter((overwrite) => overwrite && !channel.guild.isCIA(overwrite.id))

	let auditType: 'CHANNEL_OVERWRITE_DELETE' | 'CHANNEL_OVERWRITE_CREATE' | 'CHANNEL_OVERWRITE_UPDATE'

	if (addedOverwrites.size) {
		auditType = 'CHANNEL_OVERWRITE_CREATE'
	} else if (updatedOverwrites.length) {
		auditType = 'CHANNEL_OVERWRITE_UPDATE'
	} else return


	const { executor } = await channel.guild.fetchAudit(auditType, channel.id) ?? {}

	if (executor && channel.guild.isIgnored(executor.id)) {
		return
	}

	if (addedOverwrites.size) {
		await Promise.allSettled(addedOverwrites.map((overwrite) => overwrite.delete(`(${executor?.tag ?? 'Unknown#0000'}): DETECT BAD PERMISSIONS!`)))
	} else if (updatedOverwrites.length) {
		await Promise.allSettled(updatedOverwrites.map((overwrite) => {
			if (!overwrite) return

			const permissions = overwriteSerializer({
				allow: overwrite.allow.bitfield,
				deny: overwrite.deny.bitfield
			})

			for (const bad of BAD_PERMISSIONS_STRING) {
				if (permissions[bad as keyof PermissionObject]) {
					permissions[bad as keyof PermissionObject] = false
				}
			}

			return overwrite.update(permissions, `(${executor?.tag ?? 'Unknown#0000'}): DETECT BAD PERMISSIONS!`)
		}))
	}
}