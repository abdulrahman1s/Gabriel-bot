import type { Role } from 'discord.js'
import { BAD_PERMISSIONS } from '../Constants'

export const roleCreate = async (role: Role): Promise<void> => {
    if (role.permissions.any(BAD_PERMISSIONS) && !role.managed) {
         await role.delete('Detected creation of role with bad permissions')
    }
}
