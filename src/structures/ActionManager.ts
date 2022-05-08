import { LimitedCollection, GuildAuditLogsActionType, GuildAuditLogsEntry } from 'discord.js'
import config from '../config'

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
    constructor() {
        super({ maxSize: 100 })
    }

    scan(action: Action): boolean {
        this.set(action.id, action)
        const limit = config.limits.actions[action.type.toLowerCase() as Lowercase<GuildAuditLogsActionType>]
        const now = Date.now()
        return super.filter((a) => a.executorId === action.executorId && a.type === action.type && now - a.timestamp <= limit.time).size >= limit.max
    }

    globalScan(type: Action['type']) {
        const { time, max } = config.limits.global
        const now = Date.now()
        const actions = super.filter((a) => a.type === type && now - a.timestamp <= time)
        return {
            actions,
            redAlert: actions.size >= max
        }
    }
}
