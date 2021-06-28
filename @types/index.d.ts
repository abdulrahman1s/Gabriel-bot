import type { GuildAuditLogsActionType, PermissionResolvable, Snowflake } from 'discord.js'
import type { ActionManager } from '../structures'

declare module 'discord.js' {
    interface Command {
        name: string
        run(message: Message, args: string[]): Awaited<void | unknown>
    }

    interface Client {
        readonly commands: Collection<string, Command>
        readonly owners: Collection<Snowflake, User>
        load(type: 'commands' | 'events'): number
    }

    interface Guild {
        readonly actions: ActionManager
        readonly running: Set<'GLOBAL' | Snowflake>
        owner: GuildMember | null
        isIgnored(id: Snowflake): boolean
        isCIA(id: Snowflake): boolean
        check(type: keyof GuildAuditLogsActions, targetId?: Snowflake): Promise<void>
        fetchEntry(type: keyof GuildAuditLogsActions, targetId?: Snowflake): Promise<GuildAuditLogsEntry | null>
    }

    interface GuildMember {
        dm(message: unknown, options?: { times: number }): Promise<boolean>
    }
}

type Config = Readonly<{
    CHECK_MESSAGE: string
    INTERAVL: number
    GLOBAL_LIMIT: string
    HOOK_LIMIT: string
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
    permissions: PermissionResolvable
}
