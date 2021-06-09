import type { PermissionResolvable, Snowflake } from 'discord.js'
import { Permissions } from 'discord.js'
import ms from 'ms'
import config from './config'


const 
	ADMINISTRATOR = Permissions.FLAGS.ADMINISTRATOR,
	NORMAL_PERMISSIONS = new Permissions([
		Permissions.FLAGS.SEND_MESSAGES,
		Permissions.FLAGS.EMBED_LINKS,
		Permissions.FLAGS.VIEW_CHANNEL,
		Permissions.FLAGS.ATTACH_FILES,
		Permissions.FLAGS.READ_MESSAGE_HISTORY,
		Permissions.FLAGS.ADD_REACTIONS
	]).freeze(),
	VOICE_PERMISSIONS = NORMAL_PERMISSIONS.add([
		Permissions.FLAGS.CONNECT, 
		Permissions.FLAGS.SPEAK
	]).freeze()


export const BAD_PERMISSIONS_OBJECT = {
	ADMINISTRATOR: Permissions.FLAGS.ADMINISTRATOR,
	MANAGE_CHANNELS: Permissions.FLAGS.MANAGE_CHANNELS,
	MANAGE_GUILD: Permissions.FLAGS.MANAGE_GUILD,
	MANAGE_MESSAGES: Permissions.FLAGS.MANAGE_MESSAGES,
	MANAGE_NICKNAMES: Permissions.FLAGS.MANAGE_NICKNAMES,
	MANAGE_ROLES: Permissions.FLAGS.MANAGE_ROLES,
	MANAGE_WEBHOOKS: Permissions.FLAGS.MANAGE_WEBHOOKS,
	BAN_MEMBERS: Permissions.FLAGS.BAN_MEMBERS,
	KICK_MEMBERS: Permissions.FLAGS.KICK_MEMBERS
}

export const BAD_PERMISSIONS = Object.values(BAD_PERMISSIONS_OBJECT)

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


export const TRUSTED_BOTS_OBJECT = <{
	[key: string]: {
		name: string
		permissions: PermissionResolvable
	}
}>{
		'240254129333731328': {
			name: 'Vortex',
			permissions: ADMINISTRATOR
		},
		'235148962103951360': {
			name: 'Carl',
			permissions: ADMINISTRATOR
		},
		'282859044593598464': {
			name: 'Probot',
			permissions: ADMINISTRATOR
		}, 
		'161660517914509312': {
			name: 'Dyno',
			permissions: ADMINISTRATOR
		},
		'294882584201003009': {
			name: 'GiveawayBot',
			permissions: 347200n
		},
		'270904126974590976': {
			name: 'Dank Memer',
			permissions: NORMAL_PERMISSIONS
		},
		'234395307759108106': {
			name: 'Groovy',
			permissions: VOICE_PERMISSIONS
		},
		'557628352828014614': {
			name: 'Ticket Tool',
			permissions: NORMAL_PERMISSIONS.add([
				Permissions.FLAGS.MANAGE_CHANNELS,
				Permissions.FLAGS.MANAGE_MESSAGES,
				Permissions.FLAGS.MANAGE_WEBHOOKS,
				Permissions.FLAGS.MANAGE_ROLES
			])
		},
		'467377486141980682': {
			name: 'Countr',
			permissions: NORMAL_PERMISSIONS.add([
				Permissions.FLAGS.MANAGE_MESSAGES,
				Permissions.FLAGS.MANAGE_WEBHOOKS,
				Permissions.FLAGS.MANAGE_CHANNELS
			])
		},
		'235088799074484224': {
			name: 'Rythm',
			permissions: VOICE_PERMISSIONS
		},
		'339254240012664832': {
			name: 'Amari bot',
			permissions: NORMAL_PERMISSIONS.add([
				Permissions.FLAGS.MANAGE_ROLES
			])
		},
		'411916947773587456': {
			name: 'Jockie Music',
			permissions: VOICE_PERMISSIONS
		}, 
		'412347257233604609': {
			name: 'Jockie Music 1',
			permissions: VOICE_PERMISSIONS
		}, 
		'412347553141751808': {
			name: 'Jockie Music 2',
			permissions: VOICE_PERMISSIONS
		}, 
		'412347780841865216': {
			name: 'Jockie Music 3',
			permissions: VOICE_PERMISSIONS
		}
	}

export const TRUSTED_BOTS = Object.keys(TRUSTED_BOTS_OBJECT) as Snowflake[]
export const IGNORED_IDS = config.IGNORED_IDS.concat(TRUSTED_BOTS)