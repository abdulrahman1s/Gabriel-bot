import { CTX, Command, CommandError } from '../structures'

export class KickCommand implements Command {
    name = 'kick'
    description = 'Kicks a user'
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
    permissions = ['KICK_MEMBERS'] as const
    async run(ctx: CTX) {
        const member = ctx.options.getMember('user', true)
        const reason = ctx.options.getString('reason') || 'No reason'

        if (member.id === ctx.user.id) throw new CommandError('You can\'t kick yourself')
        if (member.id === ctx.client.user.id) throw new CommandError('You can\'t kick me')
        
        await member.kick(reason)

        return ctx.reply(`**${member.user.tag}** has been kicked for **${reason}**`)
    }
}