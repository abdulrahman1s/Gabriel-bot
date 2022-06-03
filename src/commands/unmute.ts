import { CTX, Command, CommandError } from '../structures'

export class UnmuteCommand implements Command {
    name = 'unmute'
    description = 'Unmutes a user'
    options = [{
        name: 'user',
        type: 'USER' as const,
        description: 'Targeted user',
        required: true
    }]
    permissions = ['MUTE_MEMBERS'] as const
    async run(ctx: CTX) {
        const member = ctx.options.getMember('user', true) 

        if (member.communicationDisabledUntilTimestamp < Date.now()) throw new CommandError(`**${member.user.tag}** isn't muted`)

        await member.disableCommunicationUntil(null)

        return ctx.reply(`${member} has been unmuted.`)
    }
}
