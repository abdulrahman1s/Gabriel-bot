import { CTX, Command, CommandError } from '../structures'
import { setTimeout as sleep } from 'timers/promises'

export class ClearCommand implements Command {
    name = 'clear'
    description = 'Clears chat messages'
    options = [{
        name: 'count',
        type: 'INTEGER' as const,
        description: 'Number of messages you want to delete (default: 50)',
        required: false
    }]

    async run(ctx: CTX) {
        const count = ctx.options.getInteger('count') ?? 50

        if (count > 100 || count <= 0) throw new CommandError('Number of messages must be lower than `100` and greater than `0`.')

        const deletedMessages = await ctx.channel.bulkDelete(count)
        const msg = await ctx.reply({ content: `**${deletedMessages.size}** of messages has been deleted`, fetchReply: true })

        return sleep(3000).then(msg.delete)
    }
}