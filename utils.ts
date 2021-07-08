import { LimitFormat } from '@types'
import { PermissionOverwrites, Permissions, PermissionString } from 'discord.js'
import ms from 'ms'
import { isPromise } from 'util/types'


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
        throw new TypeError('MAX or TIME is not a number.')
    }

    return parsed
}

export const kindOf = (x: unknown): string => {
    if (typeof x === 'undefined') return 'void'
    if (x === null) return 'null'
    if (isPromise(x)) return 'Promise<any>'
    if (Number.isNaN(x)) return 'NaN'
    if (Array.isArray(x)) return `${x.length === 0 ? 'never' : kindOf(x[0])}[]`
    return typeof x
}