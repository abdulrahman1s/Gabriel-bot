import { Permissions } from 'discord.js'
import { GuildSettings } from '../@types'
import ms from 'ms'

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
    Permissions.FLAGS.MENTION_EVERYONE,
    Permissions.FLAGS.MUTE_MEMBERS
]

export const BAD_PERMISSIONS_STRING = new Permissions(BAD_PERMISSIONS).toArray()


export const DEFAULT_GUILD_SETTINGS: GuildSettings = {
    privateAlerts: true,
    ignoredIds: [],
    limits: {
        global: {
            max: 15,
            time: ms('1 minute')
        },
        create: {
            max: 3,
            time: ms('5 minutes')
        },
        update: {
            max: 5,
            time: ms('5 minutes')
        },
        delete: {
            max: 3,
            time: ms('3 minutes')
        },
        messages: {
            hook: {
                max: 3,
                time: ms('5 seconds')
            },
            user: {
                max: 30,
                time: ms('30 seconds')
            }
        }
    },
    snapshots: {
        enabled: false
    }
}