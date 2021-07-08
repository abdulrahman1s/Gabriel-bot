import { Command, Message, Formatters } from 'discord.js'
import ms from 'ms'
import botConfig from '../config'

export class ConfigCommand implements Command {
    name = 'config'
    run(message: Message): Promise<unknown> {
        const config = `const config = {
	CIA_ENALBED: ${message.guild!.roles.highest.tags?.botId === message.client.user!.id}, // I have the highest role

	TIMEOUT: "${ms(botConfig.INTERAVL, { long: true })}",

	LIMITS: {
		GLOBAL: "${botConfig.GLOBAL_LIMIT}",
		HOOK: "${botConfig.HOOK_LIMIT}", // Auto-delete if detect @everyone mention.
		SPAM: "${botConfig.SPAM_LIMIT}", // @everyone and invites spam.
		USER: {
			DELETE: ${botConfig.LIMITS.DELETE},
			CREATE: ${botConfig.LIMITS.CREATE},
			UPDATE: ${botConfig.LIMITS.UPDATE}
		}
	},
			
	REMEMBER: "I'm not sleeping ._.",

	ALSO_WATCH: "https://youtu.be/3V5KA-X9nqw" // *Recommended!*
};`

        return message.reply(Formatters.codeBlock('js', config))
    }
}
