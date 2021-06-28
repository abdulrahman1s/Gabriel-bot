import { Command, Message, Util } from 'discord.js'
import { inspect } from 'util'
import { isPromise } from 'util/types'
import { codeblock } from '../utils'

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
                type = `Promise<${this.getType(output)}>`
            } else {
                output = result
                type = this.getType(output)
            }
        } catch (error) {
            output = error
            type = error?.name ?? this.getType(error)
        }

        output = inspect(output, { depth: 0 })

        return Util.splitMessage(`\`[output]:\` ${codeblock(output)}\n\`[type]:\` ${codeblock(type, 'ts')}`, {
            char: '\n',
            maxLength: 1900
        }).map((text) => {
            return message.channel.send(text)
        })
    }

    getType(x: unknown): string {
        if (x === null) return 'null'
        if (typeof x === 'undefined') return 'void'
        if (Number.isNaN(x)) return 'NaN'
        return typeof x
    }
}
