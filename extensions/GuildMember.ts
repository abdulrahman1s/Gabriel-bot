import { Structures } from 'discord.js'

Structures.extend('GuildMember', Base => class GuildMember extends Base {
	async dm(message: string, { times = 1 } = {}): Promise<boolean> {
		
		for (let i = 0; i < times; i++) {
			try {
				await this.send(message)
			} catch {
				return false
			}
		}
		
		return true
	}
})