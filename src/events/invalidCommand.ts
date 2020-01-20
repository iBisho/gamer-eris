// Logs that a command run (even if it was inhibited)
import { Message, GuildTextableChannel } from 'eris'
import Event from '../lib/structures/Event'
import { CommandContext } from 'yuuko'
import Gamer from '..'

export default class extends Event {
  async execute(message: Message, args: string[], context: CommandContext) {
    if (!message.guildID) return

    const shortcut = await Gamer.database.models.shortcut.findOne({
      guildID: message.guildID,
      name: context.commandName
    })
    if (!shortcut) return

    // Valid shortcut was found now we need to process it
    for (const action of shortcut.actions) {
      const command = Gamer.commandForName(action.command)
      if (!command) continue

      let content = action.args.join(' ')
      // Replace all variables args in the shortcut
      for (const [index, arg] of args.entries()) content = content.replace(`{{${index + 1}}}`, arg)

      // Execute the command
      command.execute(message, content.split(' '), context)

      // Make the bot wait 2 seconds before running next command so it doesnt get inhibited by the slowmode
      await Gamer.helpers.utils.sleep(2)
    }

    const language = Gamer.getLanguage(message.guildID)
    if (
      !language ||
      !shortcut.deleteTrigger ||
      !(message.channel as GuildTextableChannel).permissionsOf(Gamer.user.id).has('manageMessages')
    )
      return

    message.delete(language(`shortcuts/shortcutcreate:DELETE_TRIGGER_REASON`))
  }
}
