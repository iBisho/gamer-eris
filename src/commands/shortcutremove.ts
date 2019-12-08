import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`shortcutremove`, `scr`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name] = args
  if (!name) return helpCommand.execute(message, [`shortcutremove`], context)

  const deleted = await Gamer.database.models.shortcut.findOneAndDelete({
    guildID: message.channel.guild.id,
    name: name.toLowerCase()
  })

  if (!deleted) return message.channel.createMessage(language(`shortcuts/shortcutremove:INVALID_NAME`, { name }))

  return message.channel.createMessage(language(`shortcuts/shortcutremove:DELETED`))
})
