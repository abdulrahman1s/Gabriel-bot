import { CTX, Command, CommandError } from '../structures'

export class BanCommand implements Command {
    name = 'ban'
    description = 'Bans a user'
    options = [{
        name: 'user',
        type: 'USER' as const,
        description: 'Targeted user',
        required: true
    }, {
        name: 'reason',
        type: 'STRING' as const,
        description: 'Specify the reason',
        required: false
    }]
    permissions = ['BAN_MEMBERS'] as const
    async run(ctx: CTX) {
        const user = ctx.options.getUser('user', true)
        const reason = ctx.options.getString('reason') || 'No reason'

        if (user.id === ctx.user.id) throw new CommandError('You can\'t ban yourself')
        if (user.id === ctx.client.user.id) throw new CommandError('You can\'t ban me')

        await ctx.guild.members.ban(user, { reason })

        return ctx.reply(`**${user.tag}** has been banned for **${reason}**`)
    }
}