import type { Action } from '@types'
import type { Snowflake } from 'discord.js'
import { Collection } from 'discord.js'
import config from '../config'

export class ActionManager {
	cache = new Collection<Snowflake, Collection<Snowflake, Action>>()

	add(actionInfo: Action): Collection<Snowflake, Action> {
		const db = this.cache.get(actionInfo.executorId) ?? this.cache.set(actionInfo.executorId, new Collection()).get(actionInfo.executorId)!
		
		db.set(actionInfo.id, actionInfo)

		setTimeout(() => db.delete(actionInfo.id), config.INTERAVL)

		return db
	}

	flat(): Action[] {
		return this.cache.reduce((array, actions) => {
			array.push(...actions.values())
			return array
		}, <Action[]>[])
	}
}