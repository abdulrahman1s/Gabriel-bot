import { UserFlags, GuildMember } from 'discord.js'
import { BAD_PERMISSIONS } from '../Constants'

export const guildMemberAdd = async (member: GuildMember): Promise<void> => {
    if (!member.guild.active) return
    if (!member.user.bot || !member.guild.isPunishable(member.user.id)) return

    const executor = await member.guild.fetchExecutor('BOT_ADD', member.id)

    if (executor && !member.guild.isPunishable(executor.id)) {
        member.guild.owner?.dm(`**${executor.tag}** Added: **${member.user.tag}**`)
    } 
    
    if (executor) {
        const flags = await member.user.fetchFlags(false), botRole = member.roles.botRole

        // Verified bots can pass the test but without permissions
        if (botRole && flags.has(UserFlags.FLAGS.VERIFIED_BOT)) {
            await botRole.setPermissions(botRole.permissions.remove(BAD_PERMISSIONS))
            member.guild.owner?.dm(`**${executor.tag}** Added: **${member.user.tag}**`)
        } else {
            await member.kick(`(${executor.tag}): Ask the owners to add this bot` )
        }
    } else {
        await member.kick("Couldn't find who invited this bot...")
    }
}
