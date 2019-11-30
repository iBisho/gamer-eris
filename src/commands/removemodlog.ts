import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'

export default new Command([`removemodlog`, `rml`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings ? guildSettings.staff.modRoleIDs : []) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  const [id] = args
  const modlogID = parseInt(id, 10)
  if (!id) return message.channel.createMessage(language(`moderation/removemodlog:NOT_FOUND`, { id: modlogID }))

  Gamer.database.models.modlog.deleteOne({ guildID: message.channel.guild.id, modlogID })

  return message.channel.createMessage(language(`moderation/removemodlog:REMOVED`, { id: modlogID }))
})
