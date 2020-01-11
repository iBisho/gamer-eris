import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`tagdelete`, `td`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.channel.guild.id)

  const [name] = args
  if (!name) return helpCommand.process(message, [`tagdelete`], context)

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const tagName = name.toLowerCase()

  const deleted = await Gamer.database.models.tag.findOneAndDelete({
    guildID: message.channel.guild.id,
    name: tagName
  })

  if (!deleted) return message.channel.createMessage(language(`tags/tagdelete:INVALID_NAME`, { name }))
  Gamer.tags.delete(`${message.channel.guild.id}.${tagName}`)

  return message.channel.createMessage(language(`tags/tagdelete:DELETED`, { name }))
})
