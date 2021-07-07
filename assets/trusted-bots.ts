import type { TrustedBot } from '@types'
import { Permissions } from 'discord.js'

const ADMINISTRATOR = Permissions.FLAGS.ADMINISTRATOR

const NORMAL_PERMISSIONS = new Permissions([
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.ATTACH_FILES,
    Permissions.FLAGS.READ_MESSAGE_HISTORY,
    Permissions.FLAGS.ADD_REACTIONS
]).freeze()

const VOICE_PERMISSIONS = NORMAL_PERMISSIONS.add([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK]).bitfield

const LIST: TrustedBot[] = [
    {
        name: 'Vortex',
        permissions: ADMINISTRATOR,
        id: '240254129333731328'
    },
    {
        name: 'Carl',
        permissions: ADMINISTRATOR,
        id: '235148962103951360'
    },
    {
        name: 'Probot',
        permissions: ADMINISTRATOR,
        id: '282859044593598464'
    },
    {
        name: 'Dyno',
        permissions: ADMINISTRATOR,
        id: '161660517914509312'
    },
    {
        name: 'GiveawayBot',
        permissions: 347200n,
        id: '294882584201003009'
    },
    {
        name: 'Dank Memer',
        permissions: NORMAL_PERMISSIONS.bitfield,
        id: '270904126974590976'
    },
    {
        name: 'Groovy',
        permissions: VOICE_PERMISSIONS,
        id: '234395307759108106'
    },
    {
        name: 'Ticket Tool',
        permissions: NORMAL_PERMISSIONS.add([
            Permissions.FLAGS.MANAGE_CHANNELS,
            Permissions.FLAGS.MANAGE_MESSAGES,
            Permissions.FLAGS.MANAGE_WEBHOOKS,
            Permissions.FLAGS.MANAGE_ROLES
        ]).bitfield,
        id: '557628352828014614'
    },
    {
        name: 'Countr',
        permissions: NORMAL_PERMISSIONS.add([
            Permissions.FLAGS.MANAGE_MESSAGES,
            Permissions.FLAGS.MANAGE_WEBHOOKS,
            Permissions.FLAGS.MANAGE_CHANNELS
        ]).bitfield,
        id: '467377486141980682'
    },
    {
        name: 'Rythm',
        permissions: VOICE_PERMISSIONS,
        id: '235088799074484224'
    },
    {
        name: 'Amari bot',
        permissions: NORMAL_PERMISSIONS.add(Permissions.FLAGS.MANAGE_ROLES).bitfield,
        id: '339254240012664832'
    },
    {
        name: 'Jockie Music',
        permissions: VOICE_PERMISSIONS,
        id: '411916947773587456'
    },
    {
        name: 'Jockie Music 1',
        permissions: VOICE_PERMISSIONS,
        id: '412347257233604609'
    },
    {
        name: 'Jockie Music 2',
        permissions: VOICE_PERMISSIONS,
        id: '412347553141751808'
    },
    {
        name: 'Jockie Music 3',
        permissions: VOICE_PERMISSIONS,
        id: '412347780841865216'
    }
]

export default LIST
