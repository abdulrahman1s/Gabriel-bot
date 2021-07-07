import { Command, Message, MessageEmbed, Snowflake } from 'discord.js'

export class ActionsCommand implements Command {
    name = 'actions'
    async run(message: Message, args: string[]): Promise<unknown> {
        const user =
            message.mentions.users.first() || (await message.client.users.fetch(args[0] as Snowflake).catch(() => null))

        if (!user) {
            return message.reply('User not found!')
        }

        const actions = message.guild!.actions.ensure(user.id)
        const embed = new MessageEmbed()
            .setAuthor(user.tag, user.displayAvatarURL({ dynamic: true }))
            .setColor('#2f3136')
            .setFooter('Last Seen')
            .setTimestamp(new Date(actions.last()?.timestamp ?? Date.now()))

        embed.addField('Create:', `\`${actions.filter(({ type }) => type === 'CREATE').size}\``)
        embed.addField('Delete:', `\`${actions.filter(({ type }) => type === 'DELETE').size}\``)
        embed.addField('Update:', `\`${actions.filter(({ type }) => type === 'UPDATE').size}\``)

        return message.reply({ embeds: [embed] })
    }
}
