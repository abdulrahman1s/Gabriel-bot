import { Permissions } from 'discord.js'
import badWords from '../assets/bad-words.json'

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

export const BAD_WORDS = badWords.sort()