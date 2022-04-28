import { Collection, Guild, GuildChannelTypes, GuildEditData, OverwriteData } from 'discord.js'

namespace Snapshot {
    export interface Role {
        name: string
        color: number
        permissions: bigint
        hoist: boolean
        mentionable: boolean
    }
    
    export interface Emoji {
        name: string
        url: string
    }
    
    export interface Channel {
        name: string
        type: GuildChannelTypes
        position: number
        overwrites: OverwriteData[]
        parent?: string
        children: Collection<string, (Omit<Channel, 'children'>)>
    }
}




export class Snapshot {
    name!: string
    icon: string | null = null
    banner: string | null = null
    description: string | null = null
    readonly roles = new Collection<string, Snapshot.Role>()
    readonly channels = new Collection<string, Snapshot.Channel>()
    readonly emojis = new Collection<string, Snapshot.Emoji>()
    readonly createdTimestamp = Date.now()

    static async take(guild: Guild): Promise<Snapshot> {
        const shot = new Snapshot()

        shot.name = guild.name
        shot.description = guild.description
        shot.banner = guild.banner

        for (const [id, channel] of guild.channels.cache) {
            if (channel.isThread()) continue

            const channelShot: Snapshot.Channel = {
                name: channel.name,
                type: channel.type,
                position: channel.position,
                overwrites: channel.permissionOverwrites.cache.toJSON(),
                children: channel.type === 'GUILD_CATEGORY' ? channel.children.mapValues((child) => {
                    return {
                        name: child.name,
                        type: child.type,
                        position: child.position,
                        overwrites: child.permissionOverwrites.cache.toJSON(),
                        parent: channel.id
                    }
                }) : new Collection(),
                parent: channel.parentId || void 0
            }

            shot.channels.set(id, channelShot)
        }

        for (const [id, role] of guild.roles.cache.sort((a, b) => b.position - a.position)) {
            if (role.id === guild.id || role.managed) continue

            const roleShot: Snapshot.Role = {
                name: role.name,
                color: role.color,
                permissions: role.permissions.bitfield,
                hoist: role.hoist,
                mentionable: role.mentionable
            }

            shot.roles.set(id, roleShot)
        }

        for (const [id, emoji] of guild.emojis.cache) {
            const emojiShot: Snapshot.Emoji = {
                name: emoji.name!,
                url: emoji.url
            }

            shot.emojis.set(id, emojiShot)
        }


        return shot
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

        // will be ignored if the object empty
        for (const _ in editGuildOptions) {
            promises.push(guild.edit(editGuildOptions))
            break
        }

        const addedChannels = guild.channels.cache.filter((c) => !shot.channels.has(c.id))
        const removedChannels = shot.channels.filter((_, id) => !guild.channels.cache.has(id))

        const removedCategories = removedChannels.filter(c => c.type === 'GUILD_CATEGORY')
        const otherRemovedChannels = removedChannels.filter((c, id) => {
            return c.type !== 'GUILD_CATEGORY' && !removedCategories.some(cat => cat.children.has(id))
        })

        for (const c of addedChannels.values()) promises.push(c.delete())
        for (const c of removedCategories.values()) promises.push(guild.channels.create(c.name, c).then(cat => {
            const nestedPromises: Promise<unknown>[] = []

            for (const child of c.children.values()) {
                nestedPromises.push(guild.channels.create(child.name, { ...child, parent: cat.id }))
            }

            return Promise.all(nestedPromises)
        }))

        for (const c of otherRemovedChannels.values()) promises.push(guild.channels.create(c.name, c))

        const addedEmojis = guild.emojis.cache.filter((e) => !shot.emojis.has(e.id))
        const removedEmojis = shot.emojis.filter((_, id) => !guild.emojis.cache.has(id))

        for (const e of addedEmojis.values()) promises.push(e.delete())
        for (const e of removedEmojis.values()) promises.push(guild.emojis.create(e.url, e.name))

        const addedRoles = guild.roles.cache.filter((r) => !shot.roles.has(r.id))
        const removedRoles = shot.roles.filter((_, id) => !guild.roles.cache.has(id))

        for (const r of addedRoles.values()) promises.push(r.delete())
        for (const r of removedRoles.values()) promises.push(guild.roles.create(r))

        await Promise.allSettled(promises)

        guild.snapshot = await Snapshot.take(guild)
    }
}