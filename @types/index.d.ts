import type { Collection, GuildAuditLogsActionType, Snowflake } from 'discord.js'
import type { ActionManager } from '../structures'

declare module 'discord.js' {
    interface Command {
        name: string
        run(message: Message): Awaited<void | unknown>
    }

    interface Client {
        readonly commands: Collection<string, Command>
        readonly owners: Collection<Snowflake, User>
        sleep(ms: number): Promise<void>
        load(type: 'commands' | 'events'): number
    }

    interface Guild {
        cleanup(type: 'channels' | 'roles' | 'bots'): Promise<PromiseSettledResult<unknown>[]>
        readonly actions: ActionManager
        running: Set<'GLOBAL' | Snowflake>
        readonly owner: GuildMember | null
        punish(userId: Snowflake): Promise<void>
        isIgnored(id: Snowflake): boolean
        isCIA(id: Snowflake): boolean
        check(type: keyof GuildAuditLogsActions, targetId?: Snowflake): Promise<void>
        fetchEntry(type: keyof GuildAuditLogsActions, targetId?: Snowflake): Promise<GuildAuditLogsEntry | null>
    }

    interface GuildMember {
        dm(message: unknown, options?: { times: number }): Promise<boolean>
    }
}

type LimitFormat = `${number}/${number}${'s' | 'h' | 'm'}`

type Config = Readonly<{
    CHECK_MESSAGE: string
    INTERAVL: number
    GLOBAL_LIMIT: LimitFormat
    HOOK_LIMIT: LimitFormat
    SPAM_LIMIT: LimitFormat
    LIMITS: { [key in GuildAuditLogsActionType]: number }
    IGNORED_IDS: Snowflake[]
}>

type Action = {
    id: Snowflake
    executorId: Snowflake
    timestamp: number
    type: GuildAuditLogsActionType
}

type TrustedBot = {
    id: Snowflake
    name: string
    permissions: bigint
}
