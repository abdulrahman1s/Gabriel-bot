import { Structures } from 'discord.js'

Structures.extend('GuildMember', Base => class GuildMember extends Base {
	async dm(message: unknown, { times = 1 } = {}): Promise<boolean> {
		let i = 0, success = false

		while (i++ < times) {
			try {
				await this.send(String(message))
			} catch {
				return success
			}
		}
		
		return success = true
	}
})