import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`tagdelete`, `td`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.guildID)
  const [name] = args
  if (!name) return helpCommand.execute(message, [`tagdelete`], context)

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const tagName = name.toLowerCase()

  const deleted = await Gamer.database.models.tag.findOneAndDelete({
    guildID: message.guildID,
    name: tagName
  })

  if (!deleted) return message.channel.createMessage(language(`tags/tagdelete:INVALID_NAME`, { name }))
  Gamer.tags.delete(`${message.guildID}.${tagName}`)

  return message.channel.createMessage(language(`tags/tagdelete:DELETED`, { name }))
})
