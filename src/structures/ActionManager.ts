import { Collection, LimitedCollection, Snowflake, GuildAuditLogsActionType } from 'discord.js'


export interface Action {
    id: Snowflake
    executorId: Snowflake
    timestamp: number
    type: GuildAuditLogsActionType
}

const store = new Collection<Snowflake, ActionManager>()

export class ActionManager extends Collection<Snowflake, LimitedCollection<Snowflake, Action>> {
    ensure(id: Snowflake): LimitedCollection<Snowflake, Action> {
        return super.ensure(id, () => new LimitedCollection({ maxSize: 50 }))
    }

    add(action: Action): LimitedCollection<Snowflake, Action> {
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
        return store.ensure(id, () => new ActionManager())
    }
}
