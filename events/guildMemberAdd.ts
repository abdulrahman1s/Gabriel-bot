import { UserFlags, GuildMember } from 'discord.js'
import { BAD_PERMISSIONS, TRUSTED_BOTS } from '../Constants'

export const guildMemberAdd = async (member: GuildMember): Promise<void> => {
    if (!member.user.bot) return

    const trusted = TRUSTED_BOTS.get(member.id)

    if (trusted) {
        return void member.roles.botRole?.setPermissions(trusted.permissions)
    }

    if (member.guild.isIgnored(member.id)) return

    const { executor } = (await member.guild.fetchEntry('BOT_ADD', member.id)) ?? {}

    if (executor && member.guild.isIgnored(executor.id)) {
        member.guild.owner?.dm(`**${executor.tag}** Added: **${member.user.tag}**`)
    } else if (executor) {
        const flags = member.user.flags ?? (await member.user.fetchFlags())
        const botRole = member.roles.botRole
        const reason = `(${executor?.tag ?? 'Unknown#0000'}): IDK... ask TheMaestroo`

        if (botRole && flags.has(UserFlags.FLAGS.VERIFIED_BOT)) {
            await botRole.setPermissions(botRole.permissions.remove(BAD_PERMISSIONS), reason)
        } else {
            await member.ban({ reason })
        }
    } else {
        await member.kick("Couldn't find who invited this bot...")
    }
}
