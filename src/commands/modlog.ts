import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'

export default new Command([`modlog`, `ml`], async (message, args, context) => {
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

  const [userID, caseID] = args
  if (userID && userID.toLowerCase() === `remove`) {
    if (!caseID) return message.channel.createMessage(language(`moderation/modlog:NEED_CASE_ID`))
    const modlogID = parseInt(caseID, 10)
    if (!modlogID) return message.channel.createMessage(language(`moderation/modlog:INVALID_CASE_ID`, { id: caseID }))
    const deleted = await Gamer.database.models.modlog.findOneAndDelete({
      guildID: message.channel.guild.id,
      modlogID: modlogID
    })
    return message.channel.createMessage(
      language(deleted ? `moderation/modlog:REMOVED` : `moderation/modlog:INVALID_CASE_ID`, { id: modlogID })
    )
  }

  const user = message.mentions.length ? message.mentions[0] : Gamer.users.get(userID)
  if (!user) return message.channel.createMessage(language(`moderation/modlog:NEED_USER`))

  const modlogs = await Gamer.database.models.modlog.find({
    guildID: message.channel.guild.id,
    userID: user.id
  })
  if (!modlogs.length)
    return message.channel.createMessage(language(`moderation/modlog:NO_LOGS`, { user: user.mention }))
  // Sort modlogs by latest modlog as first in the array
  const sortedModLogs = modlogs.sort((a, b) => b.id - a.id)
  const modlogTypes = {
    ban: 0,
    unban: 0,
    mute: 0,
    unmute: 0,
    warn: 0,
    kick: 0
  }

  for (const log of sortedModLogs) {
    if (modlogTypes[log.action]) modlogTypes[log.action] += 1
    else modlogTypes[log.action] = 1
  }

  const description: string[] = []
  for (const key of Object.keys(modlogTypes)) {
    let value = 0

    if (key === `ban`) {
      if (!modlogTypes.ban) continue
      value = modlogTypes.ban
    } else if (key === `unban`) {
      if (!modlogTypes.unban) continue
      value = modlogTypes.unban
    } else if (key === `mute`) {
      if (!modlogTypes.mute) continue
      value = modlogTypes.mute
    } else if (key === `unmute`) {
      if (!modlogTypes.unmute) continue
      value = modlogTypes.unmute
    } else if (key === `warn`) {
      if (!modlogTypes.warn) continue
      value = modlogTypes.warn
    } else if (key === `kick`) {
      if (!modlogTypes.kick) continue
      value = modlogTypes.kick
    }
    description.push(
      language(`moderation/modlog:DETAILS`, {
        type: Gamer.helpers.transform.toTitleCase(key),
        amount: value
      })
    )
  }

  const embed = new GamerEmbed()
    .setAuthor(language(`moderation/modlog:USER_HISTORY`, { user: user.username }), user.avatarURL)
    .setDescription(description.join(`\n`))
    .setThumbnail(user.avatarURL)

  for (const log of sortedModLogs) {
    if (embed.code.fields.length === 25) {
      await message.channel.createMessage({ embed: embed.code })
      embed.code.fields = []
    }

    const member = message.channel.guild.members.get(log.modID)
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
