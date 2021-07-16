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
        // Owners
        '567399605877080071', // Abdullah (OLD ACCOUNT)
        '734484902128517141', // Abdullah
        // Administrator bots
        '831661630424743946', // Discord Bot (my bot)
        '841928041051848724', // Code Station
        // Channels
        '865600188541042688', // #Audit-log
        '865600204244910140' // #Mod-log
    ]
}


export default config