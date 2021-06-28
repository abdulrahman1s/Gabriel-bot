import type { Command, Message } from 'discord.js'
import { inspect } from 'util'
import { isPromise } from 'util/types'
import { codeblock } from '../utils'

export class EvalCommand implements Command {
    name = 'eval'
    async run(message: Message, args: string[]): Promise<unknown> {
        const client = message.client

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
                type = `Promise<${typeof output}>`
            } else {
                output = result
                type = typeof output
            }
        } catch (error) {
            output = error
            type = error?.name ?? typeof error
        }

        output = inspect(output, { depth: 0 })

        return message.reply({
            content: `\`[output]:\` ${codeblock(output)}\n\`[type]:\` ${codeblock(type, 'ts')}`,
            split: true
        })
    }
}
