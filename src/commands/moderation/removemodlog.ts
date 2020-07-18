import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`removemodlog`, `rml`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })

  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return

  const language = Gamer.getLanguage(message.guildID)
  const [id] = args
  if (!id) return message.channel.createMessage(language(`moderation/removemodlog:NOT_FOUND`, { id: 'None Provided' }))

  const modlogID = parseInt(id, 10)
  if (!modlogID) return message.channel.createMessage(language(`moderation/removemodlog:NOT_FOUND`, { id: modlogID }))

  Gamer.database.models.modlog.deleteOne({ guildID: message.guildID, modlogID }).exec()

  return message.channel.createMessage(language(`moderation/removemodlog:REMOVED`, { id: modlogID }))
})
