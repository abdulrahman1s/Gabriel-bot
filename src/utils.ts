import { PermissionOverwrites, Permissions, PermissionString } from 'discord.js'

export const inviteRegExp = /(https?:\/\/)?(www\.)?(disco|discord(app)?)\.(com|gg|io|li|me|net|org)(\/invite)?\/[a-z0-9-.]+/i

export const overwriteToPermissions = (overwrite: PermissionOverwrites): Record<PermissionString, boolean> => {
    const permissions = <Record<PermissionString, boolean>>{}

    for (const flag of Object.keys(Permissions.FLAGS) as PermissionString[]) {
        if (overwrite.allow.bitfield & Permissions.FLAGS[flag]) {
            permissions[flag] = true
        } else if (overwrite.deny.bitfield & Permissions.FLAGS[flag]) {
            permissions[flag] = false
        }
    }

    return permissions
}

export const createChoices = (arr: string[]) => arr.map(x => ({ name: x, value: x }))