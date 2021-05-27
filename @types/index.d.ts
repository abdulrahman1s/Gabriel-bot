import type { Collection, GuildAuditLogsActionType, Snowflake } from 'discord.js'

export interface IConfig {
    TIMEOUT: number
    LIMITS: { [key in GuildAuditLogsActionType]: number }
    WHITE_LIST: Snowflake[]
    IGNORED_CHANNELS: Snowflake[]
}

export type DB = Collection<string, {
    id: string
    executorId: Snowflake
    guildId: string
    type: GuildAuditLogsActionType
    timestamp: number
}>

export type MessageCache = Map<string, {
    content: string
    timestamp: number
    embedSize: number
}[]>