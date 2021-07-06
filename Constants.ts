import type { LimitFormat, TrustedBot } from '@types'
import { Collection, Permissions, Snowflake } from 'discord.js'
import ms from 'ms'
import TrustedBots from './assets/trusted-bots'
import config from './config'


export const BAD_PERMISSIONS = [
    Permissions.FLAGS.ADMINISTRATOR,
    Permissions.FLAGS.MANAGE_CHANNELS,
    Permissions.FLAGS.MANAGE_GUILD,
    Permissions.FLAGS.MANAGE_MESSAGES,
    Permissions.FLAGS.MANAGE_NICKNAMES,
    Permissions.FLAGS.MANAGE_ROLES,
    Permissions.FLAGS.MANAGE_WEBHOOKS,
    Permissions.FLAGS.BAN_MEMBERS,
    Permissions.FLAGS.KICK_MEMBERS,
    Permissions.FLAGS.MENTION_EVERYONE
] as const

const parseLimit = (limit: LimitFormat) => {
    const [times, time] = limit.split('/')
    return {
        MAX: parseInt(times),
        TIME: ms(time) 
    }
}

export const LIMITS = {
    ...config.LIMITS,
    GLOBAL: parseLimit(config.GLOBAL_LIMIT),
    HOOK: parseLimit(config.HOOK_LIMIT),
    EVERYONE: parseLimit(config.EVERYONE_LIMIT)
} as const

export const TRUSTED_BOTS = new Collection<Snowflake, TrustedBot>(TrustedBots.map((bot) => [bot.id, bot]))
export const IGNORED_IDS = config.IGNORED_IDS.concat(TRUSTED_BOTS.keyArray())
