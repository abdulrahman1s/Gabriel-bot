import type { CTX, SubCommand } from '../../structures'
import { MessageEmbed } from 'discord.js'
import ms from 'ms'

const humanizeBoolean = (x: unknown) => x ? '**Yes**' : '**No**'

export class SettingsShowCommand implements SubCommand {
    name = 'show'
    type = 'SUB_COMMAND' as const
    description = 'Show current settings'
    run(ctx: CTX) {
        const { privateAlerts, limits, ignoredIds } = ctx.guild.settings
        const embed = new MessageEmbed().setTitle('Guild Settings').setColor('BLURPLE')

        embed.addField('Private Alerts:', humanizeBoolean(privateAlerts))
        embed.addField('Limits:', [
            `Create **${limits.create.max}** / **${ms(limits.create.time)}**`,
            `Update **${limits.delete.max}** / **${ms(limits.delete.time)}**`,
            `Delete **${limits.update.max}** / **${ms(limits.update.time)}**`
        ].join('\n'))
        embed.addField('Trusted Users:', ignoredIds.map(id => `<@${id}>`).join(', '))

        return ctx.reply({ embeds: [embed], ephemeral: true })
    }
}