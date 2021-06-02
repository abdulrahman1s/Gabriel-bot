import type { RawData } from '@types'
import type { GuildAuditLogsActionType } from 'discord.js'
import { GuildChannel, Role, GuildBan } from 'discord.js'


export function convertToRaw(thing: GuildChannel | Role | GuildBan, auditType: GuildAuditLogsActionType): RawData {
	if (thing instanceof GuildChannel) return {
		type: 'CHANNEL',
		channel: thing.toJSON() as RawData['channel'],
		created: auditType === 'CREATE',
		deleted: auditType === 'DELETE'
	}

	if (thing instanceof Role) {
		const raw: RawData = {
			type: 'ROLE',
			role: thing.toJSON() as RawData['role'],
			created: auditType === 'CREATE',
			deleted: auditType === 'DELETE'
		}

		raw.role!.position = thing.rawPosition

		return raw
	}

	if (thing instanceof GuildBan) return {
		type: 'BAN',
		ban: {
			userId: thing.user.id,
			reason: thing.reason ?? null
		},
		created: auditType === 'CREATE',
		deleted: auditType === 'DELETE'
	}

	throw new Error('Invalid data')
}