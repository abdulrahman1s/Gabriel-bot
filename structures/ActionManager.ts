import type { Action } from '@types'
import { Collection } from 'discord.js'
import config from '../config'

export class ActionManager {
	cache = new Collection<string, Collection<string, Action>>()

	add(actionInfo: Action): Collection<string, Action> {
		if (!this.cache.has(actionInfo.executorId)) {
			this.cache.set(actionInfo.executorId, new Collection())
		}

		const db = this.cache.get(actionInfo.executorId)!

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