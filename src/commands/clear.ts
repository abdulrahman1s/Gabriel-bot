import { CTX, Command, CommandError } from '../structures'
import { setTimeout as sleep } from 'timers/promises'
import { createChoices, inviteRegExp } from '../utils'

export class ClearCommand implements Command {
    name = 'clear'
    description = 'Clears chat messages'
    options = [{
        name: 'count',
        type: 'INTEGER' as const,
        description: 'Number of messages you want to delete (default: 50)',
        required: false
    }, {
        name: 'filter',
        type: 'STRING' as const,
        description: 'filter messages based on it\'s content',
        choices: createChoices(['attachments', 'embeds', 'invites', 'bots', 'humans', 'links']),
        required: false
    }]
    async run(ctx: CTX) {
        const count = ctx.options.getInteger('count') ?? 50
        const filter = ctx.options.getString('filter')

        if (count > 100 || count <= 0) throw new CommandError('Number of messages must be lower than `100` and greater than `0`.')

        let messages = await ctx.channel.messages.fetch({ limit: count })

        switch (filter) {
            case 'bots': messages = messages.filter(m => m.author.bot); break
            case 'humans': messages = messages.filter(m => !m.author.bot); break
            case 'embeds': messages = messages.filter(m => m.embeds.length > 0); break
            case 'attachments': messages = messages.filter(m => m.attachments.size > 0); break
            case 'invites': messages = messages.filter(m => inviteRegExp.test(m.content)); break
            case 'links': messages = messages.filter(m => /https?:\/\//i.test(m.content)); break
            default: break
        }

        const deletedMessages = await ctx.channel.bulkDelete(messages)
        const msg = await ctx.reply({ content: `**${deletedMessages.size}** of messages has been deleted`, fetchReply: true })

        return sleep(3000).then(() => msg.delete())
    }
}