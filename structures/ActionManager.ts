import type { Action } from '@types'
import { Collection, Snowflake } from 'discord.js'
import config from '../config'

const store = new Map<Snowflake, ActionManager>()

export class ActionManager extends Collection<Snowflake, Collection<Snowflake, Action>> {
    ensure(id: Snowflake): Collection<Snowflake, Action> {
        return this.get(id) ?? this.set(id, new Collection()).get(id)!
    }

    add(action: Action): Collection<Snowflake, Action> {
        const db = this.ensure(action.executorId)

        db.set(action.id, action)

        setTimeout(() => db.delete(action.id), config.INTERAVL)

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
