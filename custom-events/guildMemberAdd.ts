import type { GuildMember } from 'discord.js'
import { UserFlags } from 'discord.js'

export const guildMemberAdd = async (member: GuildMember): Promise<void> => {
	if (!member.user.bot || member.guild.isIgnored(member.id)) return

	const log = await member.guild.fetchAudit('BOT_ADD', member.id)

	if (log?.executor) {
		if (member.guild.isIgnored(log.executor.id)) {
			member.guild.owner?.dm(`**${log.executor.tag}** Added: **${member.user.tag}**`)
		} else {
			await (member.user.flags?.has(UserFlags.FLAGS.VERIFIED_BOT) && member.roles.botRole
				? member.roles.botRole.setPermissions(0n)
				: member.ban({ reason: 'IDK... ask TheMaestroo' })
			)
		} 
	} else {
		await member.ban({ reason: 'Couldn\'t find who invited this bot...' })
	}
}