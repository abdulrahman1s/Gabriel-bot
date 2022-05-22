import type { DMChannel, NonThreadGuildBasedChannel } from 'discord.js'
import { BAD_PERMISSIONS, BAD_PERMISSIONS_STRING } from '../Constants'
import { overwriteToPermissions } from '../utils'


export const channelUpdate = async (
    oldChannel: DMChannel | NonThreadGuildBasedChannel,
    channel: DMChannel | NonThreadGuildBasedChannel
): Promise<void> => {
    if (channel.type === 'DM' || oldChannel.type === 'DM') return
    if (!channel.guild.active) return

    const oldOverwrites = oldChannel.permissionOverwrites.cache

    const addedOverwrites = channel.permissionOverwrites.cache.filter(({ id, allow }) => {
        return !oldOverwrites.has(id) && channel.guild.isPunishable(id) && allow.any(BAD_PERMISSIONS)
    })

    const updatedOverwrites = channel.permissionOverwrites.cache.filter(({ id, allow }) => {
        const oldOverwrite = oldOverwrites.get(id)
        if (!oldOverwrite || allow.equals(oldOverwrite.allow)) return false
        return channel.guild.isPunishable(id) && allow.remove(oldOverwrite.allow).any(BAD_PERMISSIONS)
    })

    const auditType = addedOverwrites.size
        ? 'CHANNEL_OVERWRITE_CREATE'
        : updatedOverwrites.size
        ? 'CHANNEL_OVERWRITE_UPDATE'
        : null

    if (!auditType) return

    const executor = await channel.guild.fetchExecutor(auditType, channel.id)

    if (executor && !channel.guild.isPunishable(executor.id)) {
        return
    }

    const promises: Promise<unknown>[] = []

    for (const overwrite of addedOverwrites.values()) {
        promises.push(overwrite.delete(`(${executor?.tag ?? 'Unknown#0000'}): Detected Bad Permissions!`))
    }

    for (const overwrite of updatedOverwrites.values()) {
        const permissions = overwriteToPermissions(overwrite)

        for (const flag of BAD_PERMISSIONS_STRING) {
            if (permissions[flag]) permissions[flag] = false
        }

        promises.push(overwrite.edit(permissions, `(${executor?.tag ?? 'Unknown#0000'}): Detected Bad Permissions!`))
    }

    await Promise.allSettled(promises)
}
