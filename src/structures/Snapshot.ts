import { Collection, Guild, GuildChannelTypes, GuildEditData, OverwriteData } from 'discord.js'

interface RoleSnapshot {
    name: string
    color: number
    permissions: bigint
    position: number
}

interface EmojiSnapshot {
    name: string
    hash: string
}

interface ChannelSnapshot {
    name: string
    type: GuildChannelTypes
    position: number
    overwrites: OverwriteData[]
}


export class Snapshot {
    name!: string
    icon: string | null = null
    banner: string | null = null
    description: string | null = null
    readonly roles = new Collection<string, RoleSnapshot>()
    readonly channels = new Collection<string, ChannelSnapshot>()
    readonly emojis = new Collection<string, EmojiSnapshot>()
    readonly createdTimestamp = Date.now()

    static async take(guild: Guild): Promise<Snapshot> {
        const shot = new Snapshot()

        shot.name = guild.name
        shot.description = guild.description
        shot.banner = guild.banner

        for (const [id, channel] of guild.channels.cache) {
            if (channel.isThread()) continue

            const channelShot: ChannelSnapshot = {
                name: channel.name,
                type: channel.type,
                position: channel.position,
                overwrites: channel.permissionOverwrites.cache.toJSON()
            }
            
            shot.channels.set(id, channelShot)
        }

        for (const [id, role] of guild.roles.cache) {
            if (role.id === guild.id) continue

            const roleShot: RoleSnapshot = {
                name: role.name,
                color: role.color,
                permissions: role.permissions.bitfield,
                position: role.position
            }

            shot.roles.set(id, roleShot)
        }

        for (const [id, emoji] of guild.emojis.cache) {
            const emojiShot: EmojiSnapshot = {
                name: emoji.name!,
                hash: emoji.identifier
            }
            
            shot.emojis.set(id, emojiShot)
        }


        return new Snapshot()
    }

    static async restore(guild: Guild): Promise<void> {
        const shot = guild.snapshot

        if (!shot) return

        const promises: Promise<unknown>[] = []
        const editGuildOptions: GuildEditData = {}

        if (shot.name !== guild.name) editGuildOptions.name = shot.name
        if (shot.description !== guild.description) editGuildOptions.description = shot.description
        if (shot.icon !== guild.icon) editGuildOptions.icon = shot.icon
        if (shot.banner !== guild.banner) editGuildOptions.banner = shot.banner

        promises.push(guild.edit(editGuildOptions))

        const addedChannels = guild.channels.cache.filter((c) => !shot.channels.has(c.id))
        const removedChannels = shot.channels.filter((_, id) => !guild.channels.cache.has(id))

        for (const c of addedChannels.values()) promises.push(c.delete())
        for (const c of removedChannels.values()) promises.push(guild.channels.create(c.name, c))

        const addedEmojis = guild.emojis.cache.filter((e) => !shot.emojis.has(e.id))
        const removedEmojis = shot.emojis.filter((_, id) => !guild.emojis.cache.has(id))

        for (const e of addedEmojis.values()) promises.push(e.delete())
        for (const e of removedEmojis.values()) promises.push(guild.emojis.create(e.hash, e.name))

        const addedRoles = guild.emojis.cache.filter((e) => !shot.roles.has(e.id))
        const removedRoles = shot.emojis.filter((_, id) => !guild.roles.cache.has(id))

        for (const r of addedRoles.values()) promises.push(r.delete())
        for (const r of removedRoles.values()) promises.push(guild.roles.create(r))

        await Promise.allSettled(promises)
    }
}