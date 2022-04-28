import { Collection, LimitedCollection, Snowflake, GuildAuditLogsActionType, GuildAuditLogsEntry } from 'discord.js'
import config from '../config'

export class Action {
    id: Snowflake
    executorId: Snowflake
    timestamp: number
    type: GuildAuditLogsActionType
    constructor(opts: GuildAuditLogsEntry) {
        this.id = opts.id
        this.executorId = opts.executor!.id
        this.timestamp = opts.createdTimestamp
        this.type = opts.actionType
    }
}


export class Store extends LimitedCollection<Snowflake, Action> {
    scan(action: Action): boolean {
        const { max, time } = config.limits.actions[action.type.toLowerCase() as Lowercase<GuildAuditLogsActionType>]
        const now = Date.now()
        return super.filter(({ type, timestamp }) => type === action.type && now - timestamp <= time).size >= max
    }
}


export class ActionManager extends Collection<Snowflake, Store> {
    private static stores = new Collection<Snowflake, ActionManager>()

    scan(type: Action['type']) {
        const { time, max } = config.limits.global
        const now = Date.now()
        const actions = this.flat().filter((a) => a.type === type && now - a.timestamp <= time)
        return {
            actions,
            redAlert: actions.length >= max
        }
    }

    ensure(id: Snowflake): Store {
        return super.ensure(id, () => new Store({ maxSize: 50 }))
    }

    add(action: Action): Store {
        const db = this.ensure(action.executorId)

        db.set(action.id, action)

        return db
    }

    flat(): Action[] {
        const actions: Action[] = []

        for (const collection of this.values()) {
            actions.push(...collection.values())
        }

        return actions
    }

    static get(id: Snowflake): ActionManager {
        return this.stores.ensure(id, () => new ActionManager())
    }
}
