import type { CTX, SubCommand } from '../../structures'
import { MessageEmbed } from 'discord.js'
import ms from 'ms'


export class SettingsShowCommand implements SubCommand {
    name = 'show'
    type = 'SUB_COMMAND' as const
    description = 'Show current settings'
    run(ctx: CTX) {
        const { privateAlerts, limits, ignoredIds, snapshots } = ctx.guild.settings
        const embed = new MessageEmbed().setTitle('Server Settings').setColor('#2f3136')

        embed
            .addField('Limits:', [
                `Create **${limits.create.max}** / **${ms(limits.create.time)}**`,
                `Update **${limits.update.max}** / **${ms(limits.update.time)}**`,
                `Delete **${limits.delete.max}** / **${ms(limits.delete.time)}**`
            ].join('\n'), true)
            .addField('Private Alerts:', privateAlerts ? '**Enabled**' : '**Disabled**', true)
            .addField('Snapshots:', snapshots.enabled ? '**Enabled**' : '**Disabled**', true)
            .addField('Trusted Users:', ignoredIds.map(id => `<@${id}>`).join(', ') || 'None')

        return ctx.reply({ embeds: [embed] })
    }
}
