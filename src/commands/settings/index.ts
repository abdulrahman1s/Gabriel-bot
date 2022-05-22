import { CTX, Command } from '../../structures'
import { SettingsSetCommand } from './set'
import { SettingsShowCommand } from './show'
import { SettingsToggleCommand } from './toggle'

export class SettingsCommand implements Command {
    name = 'settings'
    description = 'Guild Settings'
    options = [new SettingsShowCommand(), new SettingsSetCommand(), new SettingsToggleCommand()]
    permissions = ['ADMINISTRATOR'] as const
    run(ctx: CTX) {
        const name = ctx.options.getSubcommand(true)
        const cmd = this.options.find(c => c.name === name)
        return cmd?.run(ctx)
    }
}