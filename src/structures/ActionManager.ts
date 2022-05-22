import { LimitedCollection, GuildAuditLogsActionType, GuildAuditLogsEntry, Guild, Collection } from 'discord.js'

export type ActionType = Lowercase<Exclude<GuildAuditLogsActionType, 'ALL'>>

export class Action {
    id: string
    executorId: string
    timestamp: number
    type: GuildAuditLogsActionType
    constructor(opts: GuildAuditLogsEntry) {
        this.id = opts.id
        this.executorId = opts.executor!.id
        this.timestamp = opts.createdTimestamp
        this.type = opts.actionType
    }
}


export class ActionManager extends LimitedCollection<string, Action> {
    static cache = new Collection<string, ActionManager>()
    static get(guild: Guild): ActionManager {
        return this.cache.ensure(guild.id, () => new ActionManager(guild))
    }

    constructor(public readonly guild: Guild) {
        super({ maxSize: 100 })
    }

    scan(action: Action): boolean {
        super.set(action.id, action)

        const limit = this.guild.settings.limits[action.type.toLowerCase() as ActionType]
        const now = Date.now()

        return super.filter((a) => a.executorId === action.executorId && a.type === action.type && now - a.timestamp <= limit.time).size >= limit.max
    }

    globalScan(type: Action['type']) {
        const { time, max } = this.guild.settings.limits.global
        const now = Date.now()
        const actions = super.filter((a) => a.type === type && now - a.timestamp <= time)
        return {
            actions,
            redAlert: actions.size >= max
        }
    }
}
