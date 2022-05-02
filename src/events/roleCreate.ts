import type { Role } from 'discord.js'
import { BAD_PERMISSIONS } from '../Constants'

export const roleCreate = async (role: Role): Promise<void> => {
    if (!role.permissions.any(BAD_PERMISSIONS) || role.managed) return

    const { executor } = (await role.guild.fetchEntry('ROLE_UPDATE', role.id)) ?? {}

    if (executor && !role.client.isPunishable(executor.id)) return

    await role.delete('Detected creation of role with bad permissions')
}
