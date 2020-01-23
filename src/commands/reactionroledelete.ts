import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`reactionroledelete`, `rrd`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  const language = Gamer.getLanguage(message.guildID)

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name] = args
  if (!name) return helpCommand.process(message, [`reactionroledelete`], context)

  const reactionRole = await Gamer.database.models.reactionRole.findOne({
    name,
    guildID: message.guildID
  })

  if (!reactionRole) return message.channel.createMessage(language(`role/reactionroleadd:NOT_FOUND`, { name }))

  await Gamer.database.models.reactionRole.deleteOne({ name, guildID: message.guildID })

  return message.channel.createMessage(language(`roles/reactionroledelete:DELETED`, { name }))
})
