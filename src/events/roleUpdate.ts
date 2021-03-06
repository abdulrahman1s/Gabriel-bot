import type { Role } from 'discord.js'
import { BAD_PERMISSIONS } from '../Constants'

export const roleUpdate = async (oldRole: Role, role: Role): Promise<void> => {
    if (!role.guild.active) return

    const isMine = role.tags?.botId === role.client.user!.id || role.guild.roles.highest.id === role.id
    
    if (isMine) return role.guild.setup()
    
    if (role.permissions.equals(oldRole.permissions)) return
    if (role.tags?.botId && !role.guild.isPunishable(role.tags.botId)) return

    if (!role.permissions.any(BAD_PERMISSIONS)) return

    const isEveryone = role.id === role.guild.id
    const newPermissions = role.permissions.remove(BAD_PERMISSIONS)

    if (isEveryone) {
        await role.setPermissions(newPermissions, '@everyone cannot have bad permissions')
    }

    const executor = await role.guild.fetchExecutor('ROLE_UPDATE', role.id)

    if (executor && !role.guild.isPunishable(executor.id)) return

    if (isEveryone) {
        role.guild.owner?.dm(`**${executor?.tag ?? 'Unknown#0000'}** GIVING @everyone BAD PERMISSIONS!!`)
        if (executor) await role.guild.punish(executor.id)
    } else {
        await role.setPermissions(newPermissions, `(${executor?.tag ?? 'Unknown#0000'}): You can't add bad permissions to this role`)
    }
}
