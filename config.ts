import type { Config } from '@types'
import ms from 'ms'

const config: Config = {
    CHECK_MESSAGE: '\\._.',
    INTERAVL: ms('3 minutes'),
    GLOBAL_LIMIT: '5/15s',
    HOOK_LIMIT: '3/5s',
    SPAM_LIMIT: '3/30s',
    LIMITS: {
        DELETE: 3,
        UPDATE: 5,
        CREATE: 4,
        ALL: 3
    },
    IGNORED_IDS: [
        // Ignored IDs, could be a channel/user id
    ]
}


export default config