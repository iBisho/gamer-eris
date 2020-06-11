import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`reason`, `case`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return

  const [id, ...text] = args
  const modlogID = parseInt(id, 10)
  const language = Gamer.getLanguage(message.guildID)
  if (!modlogID) return message.channel.createMessage(language(`moderation/reason:NEED_ID`, { id }))
  if (!text.length) return message.channel.createMessage(language(`moderation/reason:NEED_REASON`))

  const log = await Gamer.database.models.modlog.findOne({
    modlogID,
    guildID: message.guildID
  })

  if (!log) return message.channel.createMessage(language(`moderation/reason:LOG_NOT_FOUND`, { id: modlogID }))

  log.reason = text.join(` `)
  log.save()

  return message.channel.createMessage(language(`moderation/reason:SUCCESS`, { id: modlogID }))
})
