import { Command, Message, MessageEmbed, Snowflake, User } from 'discord.js'

const filter = (user: User) => user.id !== user.client.user?.id

export class ActionsCommand implements Command {
    name = 'actions'
    async run(message: Message): Promise<unknown> {
        const id = message.content.match(/(\d{17,19})/)?.[1] as Snowflake
        const user =
            message.mentions.users.filter(filter).first() ||
            (id && (await message.client.users.fetch(id).catch(() => null)))

        if (!user) {
            return message.reply('User not found!')
        }

        const actions = message.guild!.actions.get(user.id)
        const embed = new MessageEmbed()
            .setAuthor(user.tag, user.displayAvatarURL({ dynamic: true }))
            .setColor('#2f3136')
            .setFooter('Last Seen')
            .setTimestamp(new Date(actions?.last()?.timestamp ?? Date.now()))

        embed.addField('Create:', `\`${actions?.filter(({ type }) => type === 'CREATE').size ?? 0}\``)
        embed.addField('Delete:', `\`${actions?.filter(({ type }) => type === 'DELETE').size ?? 0}\``)
        embed.addField('Update:', `\`${actions?.filter(({ type }) => type === 'UPDATE').size ?? 0}\``)

        return message.reply({ embeds: [embed] })
    }
}
