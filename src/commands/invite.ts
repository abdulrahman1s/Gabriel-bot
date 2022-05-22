import type { CTX, Command } from '../structures'

export class InviteCommand implements Command {
    name = 'invite'
    description = 'An invite to add me to your server'
    run(ctx: CTX) {
        const link = ctx.client.generateInvite({
            scopes: ['bot', 'applications.commands'],
            permissions: ['ADMINISTRATOR']
        })
        return ctx.reply(`[**Invite me!**](${link})`)
    }
}