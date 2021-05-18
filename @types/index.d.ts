import type { Collection, GuildAuditLogsActionType, GuildMember, Snowflake } from 'discord.js'

export interface IConfig {
    TIMEOUT: number
    LIMITS: { [key in GuildAuditLogsActionType]: number }
    WHITE_LIST: Snowflake[]
}

export type DB = Collection<string, {
    id: string
    executor: GuildMember
    guildId: string
    type: GuildAuditLogsActionType
    timestamp: number
}>