import type { TrustedBot } from '@types'
import type { Snowflake } from 'discord.js'
import { Collection, Permissions } from 'discord.js'
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
    Permissions.FLAGS.KICK_MEMBERS
] as const

export const LIMITS = {
    ...config.LIMITS,
    GLOBAL: {
        TIME: ms(config.GLOBAL_LIMIT.split('/')[1]),
        MAX: parseInt(config.GLOBAL_LIMIT.split('/')[0])
    },
    HOOK: {
        TIME: ms(config.HOOK_LIMIT.split('/')[1]),
        MAX: parseInt(config.HOOK_LIMIT.split('/')[0])
    }
} as const

export const TRUSTED_BOTS = new Collection<Snowflake, TrustedBot>(TrustedBots.map((bot) => [bot.id, bot]))
export const IGNORED_IDS = config.IGNORED_IDS.concat(TRUSTED_BOTS.keyArray())
