import type { Command, Message } from 'discord.js'
import ms from 'ms'
import botConfig from '../config'
import { codeblock } from '../utils'

export class ConfigCommand implements Command {
    name = 'config'
    run(message: Message): Promise<unknown> {
        const config = `const config = {
	CIA_ENALBED: ${message.guild!.roles.highest.tags?.botID === message.client.user!.id}, // I have the highest role

	TIMEOUT: "${ms(botConfig.INTERAVL, { long: true })}",

	LIMITS: {
		GLOBAL: "${botConfig.GLOBAL_LIMIT}",
		HOOK: "${botConfig.HOOK_LIMIT}",
		USER: {
			DELETE: ${botConfig.LIMITS.DELETE},
			CREATE: ${botConfig.LIMITS.CREATE},
			UPDATE: ${botConfig.LIMITS.UPDATE}
		}
	},

	IGNORED_IDS: [...[${botConfig.IGNORED_IDS.length} ID]],
			
	REMEMBER: "I'm not sleeping ._."
};`

        return message.reply(codeblock(config))
    }
}
