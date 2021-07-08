import { Command, Message, Formatters } from 'discord.js'
import ms from 'ms'
import config from '../config'

export class ConfigCommand implements Command {
    name = 'config'
    run(message: Message): Promise<unknown> {
        const botConfig = `const config = {
	CIA_ENALBED: ${message.guild!.roles.highest.tags?.botId === message.client.user!.id}, // I have the highest role

	TIMEOUT: "${ms(config.INTERAVL, { long: true })}",

	LIMITS: {
		GLOBAL: "${config.GLOBAL_LIMIT}",
		HOOK: "${config.HOOK_LIMIT}", // Auto-delete if detect @everyone mention.
		SPAM: "${config.SPAM_LIMIT}", // @everyone and invites spam.
		USER: {
			DELETE: ${config.LIMITS.DELETE},
			CREATE: ${config.LIMITS.CREATE},
			UPDATE: ${config.LIMITS.UPDATE}
		}
	},
			
	REMEMBER: "I'm not sleeping ._.",

	ALSO_WATCH: "https://youtu.be/3V5KA-X9nqw" // *Recommended!*
};`

        return message.reply(Formatters.codeBlock('js', botConfig))
    }
}
