import type { Config } from '@types'
import ms from 'ms'

const config: Config = {
    CHECK_MESSAGE: '\\._.',
    INTERAVL: ms('3 minutes'),
    GLOBAL_LIMIT: '5/15s',
    HOOK_LIMIT: '3/5s',
    EVERYONE_LIMIT: '3/30s',
    LIMITS: {
        DELETE: 3,
        UPDATE: 5,
        CREATE: 4,
        ALL: 3
    },
    IGNORED_IDS: [
        // Owners
        '567399605877080071',
        // Administrator bots
        '831661630424743946', // Discord Bot (my bot)
        '841928041051848724', // Code Station
        // Channels
        '764473678686978048', // #Audit-log
        '800788335563505714', // #Mod-log
        '814453330486100008' // #Invites-log
    ]
}


export default config