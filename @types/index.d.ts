import { Collection, GuildAuditLogsActionType } from 'discord.js'
import { ActionManager, Command, Snapshot } from '../src/structures'

declare module 'discord.js' {
    interface Client {
        readonly commands: Collection<string, Command>
        readonly owners: Collection<string, User>
        isPunishable(targetId: string): boolean
        loadEvents(): number
        loadCommands(): number
    }

    interface Guild {
        readonly actions: ActionManager
        readonly running: Set<'GLOBAL' | string>
        readonly owner: GuildMember | null
        snapshot: Snapshot
        active: boolean
        setup(): Promise<void>
        punish(userId: string): Promise<void>
        check(type: keyof GuildAuditLogsActions, targetId?: string): Promise<void>
        fetchEntry(type: keyof GuildAuditLogsActions, targetId?: string, isRetry?: boolean): Promise<GuildAuditLogsEntry<'ALL'> | null>
    }

    interface GuildMember {
        dm(content: string, times?: number): Promise<boolean>
    }
}