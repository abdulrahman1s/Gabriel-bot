import { Permissions, PermissionObject, PermissionString } from 'discord.js'

const inviteRegExp = /(https?:\/\/)?(www\.)?(disco|discord(app)?)\.(com|gg|io|li|me|net|org)(\/invite)?\/[a-z0-9-.]+/i

export const codeblock = (code: string, language = 'js'): string => {
    return '```' + `${language}\n` + code + '```'
}

export const overwriteSerializer = ({ allow = 0n, deny = 0n }): PermissionObject => {
    const permissions = <{ [key in PermissionString]: boolean }>{}

    for (const permission of Object.keys(Permissions.FLAGS) as PermissionString[]) {
        if (allow & Permissions.FLAGS[permission]) {
            permissions[permission] = true
        } else if (deny & Permissions.FLAGS[permission]) {
            permissions[permission] = false
        }
    }

    return permissions
}

export const isInvite = (str: string): boolean => inviteRegExp.test(str)
