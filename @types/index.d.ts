import { Collection, GuildAuditLogsActionType, Snowflake } from 'discord.js'
import { ActionManager, Command } from '../src/structures'

declare module 'discord.js' {
    interface Client {
        readonly commands: Collection<string, Command>
        readonly owners: Collection<Snowflake, User>
        isPunishable(targetId: string): boolean
        loadEvents(): number
        loadCommands(): number
    }

    interface Guild {
        readonly actions: ActionManager
        readonly running: Set<'GLOBAL' | Snowflake>
        readonly owner: GuildMember | null
        punish(userId: Snowflake): Promise<void>
        check(type: keyof GuildAuditLogsActions, targetId?: Snowflake): Promise<void>
        fetchEntry(type: keyof GuildAuditLogsActions, targetId?: Snowflake, isRetry?: boolean): Promise<GuildAuditLogsEntry<'ALL'> | null>
    }

    interface GuildMember {
        dm(content: string, times?: number): Promise<boolean>
    }
}