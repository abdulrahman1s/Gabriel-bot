import { UserFlags, GuildMember } from 'discord.js'
import { BAD_PERMISSIONS, TRUSTED_BOTS } from '../Constants'

export const guildMemberAdd = async (member: GuildMember): Promise<void> => {
    if (!member.user.bot) return

    if (TRUSTED_BOTS.has(member.id)) {
        await member.roles.botRole?.setPermissions(TRUSTED_BOTS.get(member.id)?.permissions ?? 0n)
        return
    }

    if (member.guild.isIgnored(member.id)) return

    const { executor } = (await member.guild.fetchEntry('BOT_ADD', member.id)) ?? {}

    if (executor && member.guild.isIgnored(executor.id)) {
        member.guild.owner?.dm(`**${executor.tag}** Added: **${member.user.tag}**`)
    } else if (executor) {
        const flags = member.user.flags ?? (await member.user.fetchFlags())
        await (flags.has(UserFlags.FLAGS.VERIFIED_BOT) && member.roles.botRole
            ? member.roles.botRole.setPermissions(member.roles.botRole.permissions.remove(BAD_PERMISSIONS))
            : member.ban({ reason: `(${executor?.tag ?? 'Unknown#0000'}): IDK... ask TheMaestroo` }))
    } else {
        await member.kick("Couldn't find who invited this bot...")
    }
}
