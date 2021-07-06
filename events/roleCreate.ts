import type { Role } from 'discord.js'
import { BAD_PERMISSIONS } from '../Constants'

export const roleCreate = async (role: Role): Promise<void> => {
    if (role.permissions.any(BAD_PERMISSIONS)) {
        if (!role.managed) await role.delete('BAD PERMISSIONS!')
    }
}
