import { CommandError, CTX, SubCommand } from '../../structures'
import { createChoices } from '../../utils'
import ms, { StringValue } from 'ms'
import db from '../../database'


export class SettingsSetCommand implements SubCommand {
    name = 'set'
    type = 'SUB_COMMAND' as const
    description = 'Configure bot limits'
    options = [{
        name: 'type',
        type: 'STRING' as const,
        description: 'Type of limit you want to configure',
        required: true,
        choices: createChoices(['create', 'update', 'delete'])
    }, {
        name: 'max',
        type: 'INTEGER' as const,
        description: 'Maximum tries to execute this limit',
        required: true
    }, {
        name: 'time',
        type: 'STRING' as const,
        description: 'The required time the tries can live for (ex: 5 minute)',
        required: true
    }]

    async run(ctx: CTX) {
        const type = ctx.options.getString('type', true) as 'create' | 'delete' | 'update'
        const max = ctx.options.getInteger('max', true)
        const time = ms(ctx.options.getString('time', true) as StringValue)

        if (max > 30 || max <= 0) throw new CommandError('Maximum tries must be lower than `30` and greater than `0`.')
        if (isNaN(time)) throw new CommandError('Invalid time input')

        ctx.guild.settings.limits[type] = { max, time }

        await db.set(ctx.guildId, JSON.stringify(ctx.guild.settings))

        return ctx.reply(`Settings has been updated successfully`)
    }
}