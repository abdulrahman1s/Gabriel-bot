import { BAD_PERMISSIONS } from 'Constants'
import type { Message, Command, User } from 'discord.js'
import ms from 'ms'

const filter = (user: User) => user.id !== user.client.user!.id
const random = (max: number, min: number) => Math.floor(Math.random() * (max - min + 1) + min)
const includeGay = (str?: string | null) => !!str && /gay/i.test(str)

export class GayCommand implements Command {
    name = 'gay'
    async run(message: Message): Promise<unknown> {
        const user = message.mentions.users.filter(filter).first()

        if (!user) {
            return message.reply('User not found!')
        }

        const member = await message.guild!.members.fetch({ user, force: true, cache: false }).catch(() => null)

        let gay = 0

        if (Date.now() - user.createdTimestamp < ms('1 year')) gay += random(30, 10)
        if (!user.avatar) gay += random(30, 50)

        if (member) {
            if (!user.bot && Date.now() - (member?.joinedTimestamp ?? 0) < ms('3d')) gay += random(15, 50)
            if (user.username.startsWith('!') || member.nickname?.startsWith('!')) gay += random(20, 30)
            if (member.permissions.any(BAD_PERMISSIONS)) gay -= random(10, 15)
            if (member.roles.cache.size <= 1) gay += random(24, 69)
            if (includeGay(user.username) || includeGay(member.nickname)) gay = 100
            if (member.roles.cache.some((r) => includeGay(r.name))) gay = 100
        } else {
            gay = 100
        }

        if (user.id === message.client.user!.id || message.client.owners.has(user.id)) {
            gay = 1
        }

        if (gay > 100) gay = 100
        if (gay < 0) gay = 0

        // Still gay.. lmao
        if (gay === 0) gay = random(1, 20)
        

        return message.channel.send(`How *gay* is ${user}??! ||**%${gay}**||`).then(() => {
            if (gay >= 100) return message.channel.send('😳 **Stop it.. Get some help!**\n\nhttps://tenor.com/view/stop-it-get-some-help-gif-7929301')
        })
    }
}
