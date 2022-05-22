import type { CTX, SubCommand } from '../../structures'
import db from '../../database'

const FLAGS = {
    'Private Alerts': 'privateAlerts',
    'Snapshots': 'snapshots.enabled'
}

function toggle(obj: any, path: string) {
    let parent = obj, value = obj, lastKey = path
    for (const key of path.split('.')) (parent = value, value = parent[key], lastKey = key)
    return parent[lastKey] = !value
}

export class SettingsToggleCommand implements SubCommand {
    name = 'toggle'
    type = 'SUB_COMMAND' as const
    description = 'Toggle specific setting'
    options = [{
        name: 'flag',
        type: 'STRING' as const,
        description: 'The flag you want to toggle',
        choices: Object.entries(FLAGS).map(([name, value]) => ({ name, value })),
        required: true
    }]

    async run(ctx: CTX) {
        const flag = ctx.options.getString('flag', true)
        const flagName = this.options[0].choices.find(c => c.value === flag).name
        const status = toggle(ctx.guild.settings, flag)

        await db.set(ctx.guildId, JSON.stringify(ctx.guild.settings))

        return ctx.reply(`**${flagName}** has been **${status ? 'Enabled' : 'Disabled'}**`)
    }
}