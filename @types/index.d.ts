import type { GuildAuditLogsActionType, Snowflake } from 'discord.js'
import type { ActionManager } from '../structures'

declare module 'discord.js' {
    interface Command {
        name: string
        run(message: Message, args: string[]): Promise<void | unknown> | void | unknown
    }

    interface Client {
        commands: Collection<string, Command>
        loadCommands(): number
        loadEvents(): number
    }

    interface Guild {
        readonly actions: ActionManager
        readonly running: Set<'GLOBAL' | Snowflake>
        owner: GuildMember | null
        isIgnored(id: Snowflake): boolean
        isCIA(id: Snowflake): boolean
        check(audit?: GuildAuditLogsEntry | null): Promise<void>
        fetchAudit(type: keyof GuildAuditLogsActions, targetId?: string): Promise<GuildAuditLogsEntry | null>
    }

    interface GuildMember {
        dm(message: unknown, Options?: { times: number }): Promise<boolean>
    }
}

interface IConfig {
    CHECK_MESSAGE: string
    INTERAVL: number
    GLOBAL_LIMIT: string
    HOOK_LIMIT: string
    LIMITS: { [key in GuildAuditLogsActionType]: number }
    IGNORED_IDS: Snowflake[]
}

interface Action {
    id: Snowflake
    executorId: Snowflake
    timestamp: number
    type: GuildAuditLogsActionType
}