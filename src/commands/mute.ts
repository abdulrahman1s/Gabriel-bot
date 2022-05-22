import { CTX, Command, CommandError } from '../structures'
import ms, { StringValue } from 'ms'

export class MuteCommand implements Command {
    name = 'mute'
    description = 'Mutes a user'
    options = [{
        name: 'user',
        type: 'USER' as const,
        description: 'Targeted user',
        required: true
    }, {
        name: 'duration',
        type: 'STRING' as const,
        description: 'Mute duration (default: 30 minute)',
        required: false
    }, {
        name: 'reason',
        type: 'STRING' as const,
        description: 'Specify the reason',
        required: false
    }]
    permissions = ['MUTE_MEMBERS'] as const

    async run(ctx: CTX) {
        const member = ctx.options.getMember('user', true)
        const reason = ctx.options.getString('reason') || 'No reason'
        const duration = Date.now() + ms((ctx.options.getString('duration') || '30 minute') as StringValue)

        if (member.id === ctx.client.user.id) throw new CommandError('You can\'t mute me')
        if (member.id === ctx.user.id) throw new CommandError('You can\'t mute yourself')
        if (isNaN(duration)) throw new CommandError('Invalid duration input')

        await member.disableCommunicationUntil(duration, reason)

        const formattedDuration = ms(duration, { long: true })

        return ctx.reply(`${member} has been muted until **${formattedDuration}** for ${reason}.`)
    }
}