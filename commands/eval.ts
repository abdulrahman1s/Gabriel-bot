import { Command, Message, Util, Formatters } from 'discord.js'
import { inspect } from 'util'
import { isPromise } from 'util/types'

export class EvalCommand implements Command {
    name = 'eval'
    async run(message: Message, args: string[]): Promise<unknown> {
        let code = args.join(' '),
            output = 'Empty',
            type = 'unknown'

        if (code.startsWith('```js') && code.endsWith('```')) {
            code = code.slice(5, -3)
        }

        try {
            const result = eval(code)

            if (isPromise(result)) {
                output = await result
                type = `Promise<${this.kindOf(output)}>`
            } else {
                output = result
                type = this.kindOf(output)
            }
        } catch (error) {
            output = error
            type = error?.name ?? this.kindOf(error)
        }

        output = inspect(output, { depth: 0 })
        output = Formatters.codeBlock('js', output)
        type = Formatters.codeBlock('ts', type)

        if (output.includes(message.client.token!)) {
            return message.reply('Nope!')
        }

        return Util.splitMessage(`\`[output]\` ${output}\n\`[type]\` ${type}`, {
            char: '\n',
            maxLength: 1900
        }).map((text) => {
            return message.channel.send(text)
        })
    }

    kindOf(x: unknown): string {
        if (typeof x === 'undefined') return 'void'
        if (x === null) return 'null'
        if (isPromise(x)) return 'Promise<any>'
        if (Number.isNaN(x)) return 'NaN'
        if (Array.isArray(x)) return `${x.length === 0 ? 'never' : this.kindOf(x[0])}[]`
        return typeof x
    }
}
