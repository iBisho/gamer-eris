import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`modlog`, `ml`], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return

  const [userID, caseID] = args
  const language = Gamer.getLanguage(message.guildID)
  if (userID && userID.toLowerCase() === `remove`) {
    if (!caseID) return message.channel.createMessage(language(`moderation/modlog:NEED_CASE_ID`))
    const modlogID = parseInt(caseID, 10)
    if (!modlogID) return message.channel.createMessage(language(`moderation/modlog:INVALID_CASE_ID`, { id: caseID }))
    const deleted = await Gamer.database.models.modlog.findOneAndDelete({
      guildID: message.guildID,
      modlogID: modlogID
    })
    return message.channel.createMessage(
      language(deleted ? `moderation/modlog:REMOVED` : `moderation/modlog:INVALID_CASE_ID`, { id: modlogID })
    )
  }

  const user = message.mentions.length
    ? message.mentions[0]
    : userID
    ? await Gamer.helpers.discord.fetchUser(userID)
    : message.author

  const modlogs = await Gamer.database.models.modlog.find({
    guildID: message.guildID,
    userID: user?.id || userID
  })
  if (!modlogs.length)
    return message.channel.createMessage(
      language(`moderation/modlog:NO_LOGS`, { user: user?.mention || 'Unknown User' })
    )
  // Sort modlogs by latest modlog as first in the array
  const sortedModLogs = modlogs.sort((a, b) => b.id - a.id)
  const modlogTypes = [
    { type: `Ban`, amount: modlogs.filter(log => log.action === `ban`).length },
    { type: `Unban`, amount: modlogs.filter(log => log.action === `unban`).length },
    { type: `Mute`, amount: modlogs.filter(log => log.action === `mute`).length },
    { type: `Unmute`, amount: modlogs.filter(log => log.action === `unmute`).length },
    { type: `Warn`, amount: modlogs.filter(log => log.action === `warn`).length },
    { type: `Kick`, amount: modlogs.filter(log => log.action === `kick`).length },
    { type: `Note`, amount: modlogs.filter(log => log.action === `note`).length }
  ]

  const description = modlogTypes.map(log =>
    language(`moderation/modlog:DETAILS`, { type: log.type, amount: log.amount })
  )

  const embed = new MessageEmbed()
    .setAuthor(language(`moderation/modlog:USER_HISTORY`, { user: user?.username || 'Unknown User' }), user?.avatarURL)
    .setDescription(description.join(`\n`))
  if (user) embed.setThumbnail(user.avatarURL)

  for (const log of sortedModLogs) {
    if (embed.code.fields.length === 25) {
      await message.channel.createMessage({ embed: embed.code })
      embed.code.fields = []
    }

    const member = await Gamer.helpers.discord.fetchMember(message.member.guild, log.modID)
    const memberName = member ? member.username : log.modID
    const date = new Date(log.timestamp)

    const readableDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
    embed.addField(
      language(`moderation/modlog:CASE_INFO`, {
        type: Gamer.helpers.transform.toTitleCase(log.action),
        id: log.modlogID
      }),
      language(log.duration ? `moderation/modlog:TIMED_CASE_DETAILS` : `moderation/modlog:CASE_DETAILS`, {
        mod: memberName,
        reason: log.reason,
        time: readableDate,
        duration: log.duration
      })
    )
  }

  return message.channel.createMessage({ embed: embed.code })
})
