import type { Action } from '@types'
import { Collection, LimitedCollection, Snowflake } from 'discord.js'

const store = new Map<Snowflake, ActionManager>()

export class ActionManager extends Collection<Snowflake, LimitedCollection<Snowflake, Action>> {
    ensure(id: Snowflake): LimitedCollection<Snowflake, Action> {
        return this.get(id) ?? this.set(id, new LimitedCollection({ maxSize: 50 })).get(id)!
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
        let manager = store.get(id)

        if (!manager) {
            manager = new ActionManager()
            store.set(id, manager)
        }

        return manager
    }
}
