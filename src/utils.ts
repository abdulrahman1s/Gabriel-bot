import { PermissionOverwrites, Permissions, PermissionString } from 'discord.js'

const inviteRegExp = /(https?:\/\/)?(www\.)?(disco|discord(app)?)\.(com|gg|io|li|me|net|org)(\/invite)?\/[a-z0-9-.]+/i

export const overwriteToPermission = (overwrite: PermissionOverwrites): Record<PermissionString, boolean> => {
    const permissions = <Record<PermissionString, boolean>>{}

    for (const permission of Object.keys(Permissions.FLAGS) as PermissionString[]) {
        if (overwrite.allow.bitfield & Permissions.FLAGS[permission]) {
            permissions[permission] = true
        } else if (overwrite.deny.bitfield & Permissions.FLAGS[permission]) {
            permissions[permission] = false
        }
    }

    return permissions
}

export const isInvite = (str: string) => inviteRegExp.test(str)