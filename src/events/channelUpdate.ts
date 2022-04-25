import { DMChannel, NonThreadGuildBasedChannel, Permissions } from 'discord.js'
import { BAD_PERMISSIONS } from '../Constants'
import { overwriteToPermission } from '../utils'

const BAD_PERMISSIONS_STRING = new Permissions(BAD_PERMISSIONS).toArray()

export const channelUpdate = async (
    oldChannel: DMChannel | NonThreadGuildBasedChannel,
    channel: DMChannel | NonThreadGuildBasedChannel
): Promise<void> => {
    if (channel.type === 'DM' || oldChannel.type === 'DM') return

    const oldOverwrites = oldChannel.permissionOverwrites.cache

    const addedOverwrites = channel.permissionOverwrites.cache.filter(({ id, allow }) => {
        return !oldOverwrites.has(id) && channel.client.isPunishable(id) && allow.any(BAD_PERMISSIONS)
    })

    const updatedOverwrites = channel.permissionOverwrites.cache.filter(({ id, allow }) => {
        const oldOverwrite = oldOverwrites.get(id)
        if (!oldOverwrite || allow.equals(oldOverwrite.allow)) return false
        return channel.client.isPunishable(id) && allow.remove(oldOverwrite.allow).any(BAD_PERMISSIONS)
    })

    const auditType = addedOverwrites.size
        ? 'CHANNEL_OVERWRITE_CREATE'
        : updatedOverwrites.size
        ? 'CHANNEL_OVERWRITE_UPDATE'
        : null

    if (!auditType) return

    const { executor } = (await channel.guild.fetchEntry(auditType, channel.id)) ?? {}

    if (executor && !channel.client.isPunishable(executor.id)) {
        return
    }

    const promises: Promise<unknown>[] = []

    for (const overwrite of addedOverwrites.values()) {
        promises.push(overwrite.delete(`(${executor?.tag ?? 'Unknown#0000'}): DETECT BAD PERMISSIONS!`))
    }

    for (const overwrite of updatedOverwrites.values()) {
        const permissions = overwriteToPermission(overwrite)

        for (const bad of BAD_PERMISSIONS_STRING) {
            if (permissions[bad]) permissions[bad] = false
        }

        promises.push(overwrite.edit(permissions, `(${executor?.tag ?? 'Unknown#0000'}): DETECT BAD PERMISSIONS!`))
    }

    await Promise.allSettled(promises)
}
