import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`rolesetdelete`, `rsd`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.guildID)
  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name] = args
  if (!name) return helpCommand.process(message, [`rolesetdelete`], context)

  const deleted = await Gamer.database.models.roleset.findOneAndDelete({
    guildID: message.guildID,
    name: name.toLowerCase()
  })
  if (!deleted) return message.channel.createMessage(language(`roles/rolesetdelete:INVALID_NAME`))

  return message.channel.createMessage(language(`roles/rolesetdelete:DELETED`))
})
