import type { GuildMember } from 'discord.js'
import { UserFlags } from 'discord.js'
import { BAD_PERMISSIONS, TRUSTED_BOTS_OBJECT } from '../Constants'


export const guildMemberAdd = async (member: GuildMember): Promise<void> => {
	if (!member.user.bot) return

	const trustedBotPermissions = TRUSTED_BOTS_OBJECT[member.id]?.permissions

	if (trustedBotPermissions) {
		await member.roles.botRole?.setPermissions(trustedBotPermissions)
		return
	}

	if (member.guild.isIgnored(member.id)) return

	const { executor } = await member.guild.fetchAudit('BOT_ADD', member.id) ?? {}

	if (executor && member.guild.isIgnored(executor.id)) {
		member.guild.owner?.dm(`**${executor.tag}** Added: **${member.user.tag}**`)
	} else if (executor) {
		await (member.user.flags?.has(UserFlags.FLAGS.VERIFIED_BOT) && member.roles.botRole
			? member.roles.botRole.setPermissions(member.roles.botRole.permissions.remove(BAD_PERMISSIONS))
			: member.ban({ reason: `(${executor?.tag ?? 'Unknown#0000'}): IDK... ask TheMaestroo` })
		)
	} else {
		await member.ban({ reason: 'Couldn\'t find who invited this bot...' })
	}
}