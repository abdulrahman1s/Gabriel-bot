import { Structures } from 'discord.js'

Structures.extend('GuildMember', Base => class GuildMember extends Base {
	async dm(message: string): Promise<boolean> {
		try {
			await this.send(message)
			return true
		} catch {
			return false
		}
	}
})