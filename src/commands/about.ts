import type { CTX, Command } from '../structures'
import { MessageEmbed, MessageActionRow, MessageButton } from 'discord.js'


export class AboutCommand implements Command {
    name = 'about'
    description = 'Show information about the bot'
    run(ctx: CTX) {
        const embed = new MessageEmbed().setColor('BLURPLE'), row = new MessageActionRow()

        const button = () => new MessageButton().setStyle('LINK')

        embed
            .setTitle('The story behind me!')
            .setThumbnail(ctx.client.user.displayAvatarURL())
            .setDescription('The ultimate all-in-one protection discord bot you\'ll ever need, really')

        embed.addField('The name', `**Gabriel** (**جبريل**romanized: *Jibrīl*) is is venerated as one of the primary archangels and as the Angel of Revelation in Islam. [More info...](https://en.wikipedia.org/wiki/Gabriel)`)

        const inviteLink = ctx.client.generateInvite({
            scopes: ['bot', 'applications.commands'],
            permissions: ['ADMINISTRATOR']
        })

        row.addComponents(
            button().setURL('https://ko-fi.com/abdulrahman1s').setLabel('Donation').setEmoji('🎔'),
            button().setURL('https://github.com/abdulrahman1s/Anti-Raid').setLabel('Source Code').setEmoji('💻'),
            button().setURL(inviteLink).setLabel('Invite').setEmoji('🔗')
        )

        return ctx.reply({ embeds: [embed], components: [row] })
    }
}