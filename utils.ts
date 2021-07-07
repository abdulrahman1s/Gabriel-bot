import { LimitFormat } from '@types'
import { Permissions, PermissionString } from 'discord.js'
import ms from 'ms'

const inviteRegExp = /(https?:\/\/)?(www\.)?(disco|discord(app)?)\.(com|gg|io|li|me|net|org)(\/invite)?\/[a-z0-9-.]+/i

export const overwriteSerializer = ({ allow, deny }: { allow: bigint, deny: bigint}): Record<PermissionString, boolean> => {
    const permissions = <Record<PermissionString, boolean>>{}

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


export const parseLimit = (limit: LimitFormat): {
    MAX: number
    TIME: number
} => {
    const [times, time] = limit.split('/')

    const parsed = {
        MAX: parseInt(times),
        TIME: ms(time) 
    }

    if (isNaN(parsed.MAX) || isNaN(parsed.TIME)) {
        throw new TypeError('MAX/TIME is not a number.')
    }

    return parsed
}