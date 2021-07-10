import type { Role } from 'discord.js'
import { BAD_PERMISSIONS } from '../Constants'

export const roleUpdate = async (oldRole: Role, role: Role): Promise<void> => {
    if (role.permissions.equals(oldRole.permissions)) return
    if (role.tags?.botId && role.guild.isIgnored(role.tags.botId)) return

    if (!role.permissions.any(BAD_PERMISSIONS)) return

    const isEveryone = role.id === role.guild.id

    const newPermissions = role.permissions.remove(BAD_PERMISSIONS)

    if (isEveryone) {
        await role.setPermissions(newPermissions, '._.')
    }

    const { executor } = (await role.guild.fetchEntry('ROLE_UPDATE', role.id)) ?? {}

    if (isEveryone) {
        role.guild.owner?.dm(`**${executor?.tag ?? 'Unknown#0000'}** GIVING @everyone BAD PERMISSIONS!!`)
        if (executor) await role.guild.punish(executor.id)
        return
    } else if (executor && role.guild.isIgnored(executor.id)) {
        return
    }

    await role.setPermissions(newPermissions, `(${executor?.tag ?? 'Unknown#0000'}): DON'T GIVE ANY @ROLE BAD PERMISSIONS!`)
}
