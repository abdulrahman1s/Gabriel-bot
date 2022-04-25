import env from 'env-var'
import ms from 'ms'

const parseLimit = (str: string) => {
    if (!/^\d{1,4}\/\d+(h|m|s)$/i.test(str)) throw new Error('Invalid limit value')

    const [max, time] = str.split('/')

    const parsed = {
        max: parseInt(max),
        time: ms(time as '0') 
    }

    return parsed
}


const config  = {
    token: env.get('DISCORD_TOKEN').required().asString(),
    interval: ms(env.get('INTERVAL').default('3 minutes').asString() as '0'),
    limits: {
        global: parseLimit(env.get('GLOBAL_LIMIT').default('5/15s').asString()),
        messages: {
            hook: parseLimit(env.get('HOOK_SPAM_LIMIT').default('3/5s').asString()),
            user: parseLimit(env.get('USER_SPAM_LIMIT').default('3/30s').asString())
        },
        actions: {
            create: env.get('ACTION_CREATE').default(4).asIntPositive(),
            update: env.get('ACTION_UPDATE').default(5).asIntPositive(),
            delete: env.get('ACTION_DELETE').default(3).asIntPositive(),
            all: env.get('ACTION_ALL').default(3).asIntPositive()
        }
    },
    ignoredIds: env.get('IGNORED_IDS').default([]).asArray()
}

export default config