import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'

export default new Command([`reason`, `case`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  const language = Gamer.getLanguage(message.channel.guild.id)

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings ? guildSettings.staff.modRoleIDs : []) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  const [id, ...text] = args
  const modlogID = parseInt(id, 10)
  if (!modlogID) return message.channel.createMessage(language(`moderation/reason:NEED_ID`, { id }))
  if (!text.length) return message.channel.createMessage(language(`moderation/reason:NEED_REASON`))

  const log = await Gamer.database.models.modlog.findOne({
    modlogID,
    guildID: message.channel.guild.id
  })

  if (!log) return message.channel.createMessage(language(`moderation/reason:LOG_NOT_FOUND`, { id: modlogID }))

  log.reason = text.join(` `)
  log.save()

  return message.channel.createMessage(language(`moderation/reason:SUCCESS`, { id: modlogID }))
})
