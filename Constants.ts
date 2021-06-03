import { Permissions } from 'discord.js'
import ms from 'ms'
import config from './config'


export const BAD_PERMISSIONS_STRING = [
	'ADMINISTRATOR',
	'MANAGE_CHANNELS',
	'MANAGE_GUILD',
	'MANAGE_MESSAGES',
	'MANAGE_NICKNAMES',
	'MANAGE_ROLES',
	'MANAGE_WEBHOOKS',
	'BAN_MEMBERS',
	'KICK_MEMBERS'
]

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
]


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
}