import { Collection, GuildAuditLogsActionType } from 'discord.js'
import { ActionManager, Command, Snapshot } from '../src/structures'

declare module 'discord.js' {
    interface Client {
        readonly commands: Collection<string, Command>
        loadEvents(): number
        loadCommands(): number
    }

    interface Guild {
        readonly actions: ActionManager
        readonly running: Set<'GLOBAL' | string>
        readonly owner: GuildMember | null
        snapshot: Snapshot
        active: boolean
        settings: GuildSettings
        isPunishable(targetId: string): boolean
        setup(): Promise<void>
        punish(targetId: string): Promise<void>
        check(type: keyof GuildAuditLogsActions, targetId?: string): Promise<void>
        fetchEntry(type: keyof GuildAuditLogsActions, targetId?: string, isRetry?: boolean): Promise<GuildAuditLogsEntry<'ALL'> | null>
        fetchExecutor(...args: Parameters<Guild['fetchEntry']>): Promise<User | null>
    }

    interface GuildMember {
        dm(content: string, times?: number): Promise<boolean>
    }
}

type LimitValue = { max: number, time: number }

interface GuildSettings {
    privateAlerts: boolean
    ignoredIds: string[]
    limits: {
        global: LimitValue
        create: LimitValue
        update: LimitValue
        delete: LimitValue
        messages: {
            hook: LimitValue
            user: LimitValue
        }
    }
    snapshots: {
        enabled: boolean
    }
}