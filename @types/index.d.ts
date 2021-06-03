import type { GuildAuditLogsActionType, Snowflake } from 'discord.js'
import { ActionManager, Command } from '../structures'

declare module 'discord.js' {
    interface Client {
        commands: Collection<string, Command>
    }

    interface Guild {
        actions: ActionManager
        running: Set<string>
        owner: GuildMember | null
        isIgnored(id: Snowflake): boolean
        isCIA(id: Snowflake): boolean
        check(audit?: GuildAuditLogsEntry | null, data?: GuildChannel | Role | GuildBan): Promise<void>
        fetchAudit(type: keyof GuildAuditLogsActions, targetId?: string): Promise<GuildAuditLogsEntry | null>
    }

    interface GuildMember {
        dm(message: string, Options?: { times: number }): Promise<boolean>
    }
}

export interface IConfig {
    CHECK_MESSAGE: string
    INTERAVL: number
    GLOBAL_LIMIT: string
    HOOK_LIMIT: string
    LIMITS: { [key in GuildAuditLogsActionType]: number }
    IGNORED_IDS: Snowflake[]
}

export interface Action {
    id: Snowflake
    executorId: Snowflake
    timestamp: number
    type: GuildAuditLogsActionType
}