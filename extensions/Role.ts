import { Structures } from 'discord.js'

Structures.extend('Role', Base => class Role extends Base {
	get isEveryone() {
		return this.id === this.guild.id
	}
})