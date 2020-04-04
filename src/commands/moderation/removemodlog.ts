import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`removemodlog`, `rml`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })

  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return

  const [id] = args
  const modlogID = parseInt(id, 10)
  const language = Gamer.getLanguage(message.guildID)
  if (!id) return message.channel.createMessage(language(`moderation/removemodlog:NOT_FOUND`, { id: modlogID }))

  Gamer.database.models.modlog.deleteOne({ guildID: message.guildID, modlogID }).exec()

  return message.channel.createMessage(language(`moderation/removemodlog:REMOVED`, { id: modlogID }))
})
