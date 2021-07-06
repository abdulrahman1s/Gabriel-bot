import type { DMChannel, GuildChannel } from 'discord.js'
import { Permissions } from 'discord.js'
import { BAD_PERMISSIONS } from '../Constants'
import { overwriteSerializer } from '../utils'

const BAD_PERMISSIONS_STRING = new Permissions(BAD_PERMISSIONS).remove(Permissions.FLAGS.ADMINISTRATOR).toArray()

BAD_PERMISSIONS_STRING.unshift('ADMINISTRATOR')

export const channelUpdate = async (
    oldChannel: GuildChannel | DMChannel,
    channel: GuildChannel | DMChannel
): Promise<void> => {
    if (!('guild' in channel && 'guild' in oldChannel)) return

    const oldOverwrites = oldChannel.permissionOverwrites.cache

    const addedOverwrites = channel.permissionOverwrites.cache.filter(({ id, allow }) => {
        return !oldOverwrites.has(id) && allow.any(BAD_PERMISSIONS) && !channel.guild.isIgnored(id)
    })

    const updatedOverwrites = channel.permissionOverwrites.cache.filter(({ id, allow }) => {
        const oldOverwrite = oldOverwrites.get(id)
        if (!oldOverwrite || allow.equals(oldOverwrite.allow)) return false
        return allow.remove(oldOverwrite.allow).any(BAD_PERMISSIONS) && !channel.guild.isIgnored(id)
    })

    const auditType = addedOverwrites.size
        ? 'CHANNEL_OVERWRITE_CREATE'
        : updatedOverwrites.size
        ? 'CHANNEL_OVERWRITE_UPDATE'
        : null

    if (!auditType) return

    const { executor } = (await channel.guild.fetchEntry(auditType, channel.id)) ?? {}

    if (executor && channel.guild.isIgnored(executor.id)) {
        return
    }

    if (addedOverwrites.size) {
        await Promise.allSettled(
            addedOverwrites.map((overwrite) =>
                overwrite.delete(`(${executor?.tag ?? 'Unknown#0000'}): DETECT BAD PERMISSIONS!`)
            )
        )
    }

    if (updatedOverwrites.size) {
        await Promise.allSettled(
            updatedOverwrites.map((overwrite) => {
                const permissions = overwriteSerializer({
                    allow: overwrite.allow.bitfield,
                    deny: overwrite.deny.bitfield
                })

                for (const bad of BAD_PERMISSIONS_STRING) {
                    if (permissions[bad]) permissions[bad] = false
                }

                return overwrite.edit(permissions, `(${executor?.tag ?? 'Unknown#0000'}): DETECT BAD PERMISSIONS!`)
            })
        )
    }
}
