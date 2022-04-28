import env from 'env-var'
import ms, { StringValue } from 'ms'

const parseLimit = (str: string) => {
    if (!/^\d{1,4}\/\d+(h|m|s)$/i.test(str)) throw new Error('Invalid limit value')

    const [max, time] = str.split('/')

    const parsed = {
        max: parseInt(max),
        time: ms(time as StringValue) 
    }

    return parsed
}


const config  = {
    token: env.get('DISCORD_TOKEN').required().asString(),
    limits: {
        global: parseLimit(env.get('GLOBAL_LIMIT').default('15/1m').asString()),
        messages: {
            hook: parseLimit(env.get('HOOK_SPAM_LIMIT').default('3/5s').asString()),
            user: parseLimit(env.get('USER_SPAM_LIMIT').default('30/30s').asString())
        },
        actions: {
            create: parseLimit(env.get('CREATE_LIMIT').default('4/3m').asString()),
            update: parseLimit(env.get('UPDATE_LIMIT').default('5/3m').asString()),
            delete: parseLimit(env.get('DELETE_LIMIT').default('3/3m').asString()),
            all: parseLimit(env.get('ACTION_ALL').default('3/3m').asString()),
        }
    },
    ignoredIds: env.get('IGNORED_IDS').default([]).asArray(),
    httpServer: env.get('HTTP_SERVER_ENABLED').default('true').asBool(),
    directAlerts: env.get('DIRECT_MESSAGE_ALERTS').default('true').asBool(),
    snapshots: env.get('SNAPSHOTS_ENABLED').default('true').asBool()
}


export default config