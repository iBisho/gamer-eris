import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'
import { GamerModlog } from '../lib/types/gamer'

export default new Command([`reason`, `case`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : `en-US`)
  if (!language) return

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings ? guildSettings.staff.modRoleIDs : []) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  const [id, ...text] = args
  const modlogID = parseInt(id, 10)
  if (!modlogID) return message.channel.createMessage(language(`moderation/reason:NEED_ID`, { id: modlogID }))
  if (!text.length) return message.channel.createMessage(language(`moderation/reason:NEED_REASON`))

  const log = (await Gamer.database.models.modlog.findOne({
    modlogID,
    guilID: message.channel.guild.id
  })) as GamerModlog | null
  if (!log) return message.channel.createMessage(language(`moderation/reason:LOG_NOT_FOUND`, { id: modlogID }))

  log.reason = text.join(` `)
  log.save()

  return message.channel.createMessage(language(`moderation/reason:REMOVED`, { id: modlogID }))
})
