import type { 
    GuildAuditLogsActionType, 
    Snowflake, 
    PermissionResolvable,
    GuildCreateChannelOptions,
    RoleData
} from 'discord.js'

declare module 'discord.js' {

    interface Guild {
        running: Set<string>
        owner: GuildMember | null
        isIgnored(id: Snowflake): boolean
        isCIA(id: Snowflake): boolean
        resolveAction(audit?: GuildAuditLogsEntry | null, data?: GuildChannel | Role | GuildBan): Promise<void>
        fetchAudit(type: keyof GuildAuditLogsActions, targetId?: string): Promise<GuildAuditLogsEntry | null>
    }

    interface GuildMember {
        dm(message: string): Promise<boolean>
    }
}

export interface IConfig {
    TIMEOUT: number
    CHECK_MESSAGE: string
    LIMITS: { [key in GuildAuditLogsActionType]: number }
    WHITE_LIST: Snowflake[]
    IGNORED_CHANNELS: Snowflake[]
    BAD_PERMISSIONS: PermissionResolvable[]
}

export type RawData = {
    type: 'CHANNEL' | 'ROLE' | 'BAN'
    deleted: boolean
    created: boolean
    role?: RoleData & { id: Snowflake }
    channel?: GuildCreateChannelOptions & { id: Snowflake, name: string }
    ban?: {
        userId: Snowflake
        reason: string | null
    }
}

export type Action = {
    id: string
    executorId: Snowflake
    type: GuildAuditLogsActionType
    timestamp: number
    data: RawData | null
}