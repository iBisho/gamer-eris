import { Message, User, PrivateChannel, TextChannel } from 'eris'
import GamerClient from '../structures/GamerClient'
import { GuildSettings } from '../types/settings'
import { GamerModlog } from '../types/gamer'
import GamerEmbed from '../structures/GamerEmbed'
import { modlogTypes } from '../types/enums/moderation'
import { TFunction } from 'i18next'

export default class {
  Gamer: GamerClient

  constructor(client: GamerClient) {
    this.Gamer = client
  }

  async createModlog(
    message: Message,
    guildSettings: GuildSettings | null,
    language: TFunction,
    user: User,
    action: `ban` | `unban` | `mute` | `unmute` | `warn` | `kick`,
    reason: string,
    duration?: number
  ) {
    if (message.channel instanceof PrivateChannel) return

    const member = message.channel.guild.members.get(user.id)
    if (member) {
      const memberSettings = await this.Gamer.database.models.member.findOne({
        memberID: user.id
      })
      if (memberSettings) {
        const currentXP = memberSettings.leveling.xp
        switch (action) {
          case `kick`: // Remove 50% when kicked
            if (currentXP > 0) this.Gamer.helpers.levels.removeXP(member, Math.floor(currentXP / 2))
            break
          case `warn`:
            this.Gamer.helpers.levels.removeXP(member, currentXP > 25 ? 25 : currentXP)
            break
          case `mute`:
            this.Gamer.helpers.levels.removeXP(member, currentXP > 100 ? 100 : currentXP)
            break
          case `ban`:
            if (currentXP > 0) this.Gamer.helpers.levels.removeXP(member, currentXP)
            break
          default:
        }
      }
    }

    // If it is disabled we don't need to do anything else. Return 0 for the case number response
    if (!guildSettings?.moderation.logs.modlogsChannelID) return 0

    // Generate a modlogid
    const modlogs = await this.Gamer.database.models.modlog.find({
      guildID: message.channel.guild.id
    })
    const modlogID = this.createNewID(modlogs)

    const payload = await this.Gamer.database.models.modlog.create({
      action,
      guildID: message.channel.guild.id,
      modID: message.author.id,
      modlogID,
      messageID: undefined,
      reason,
      timestamp: message.timestamp,
      userID: user.id
    })

    if (action === `mute` && duration) {
      payload.duration = duration
      payload.needsUnmute = true
    }

    const embed = this.createEmbed(message, user, payload, language)

    const modlogChannel = this.Gamer.getChannel(guildSettings.moderation.logs.modlogsChannelID)
    if (modlogChannel && modlogChannel instanceof TextChannel) {
      const botPerms = modlogChannel.permissionsOf(this.Gamer.user.id)
      if (botPerms.has('readMessages') && botPerms.has('sendMessages') && botPerms.has('embedLinks')) {
        const logMessage = await modlogChannel.createMessage({ embed: embed.code })
        payload.messageID = logMessage.id
      }
    }
    payload.save()

    if (!guildSettings.moderation.logs.publiclogsChannelID) return modlogID

    embed.setDescription(
      [
        language(`moderation/modlog:PUBLIC_MEMBER`, { user: user.username }),
        language(`moderation/modlog:PUBLIC_REASON`, { reason })
      ].join('\n')
    )

    const publicChannel = this.Gamer.getChannel(guildSettings.moderation.logs.publiclogsChannelID)
    if (publicChannel && publicChannel instanceof TextChannel) {
      const botPerms = publicChannel.permissionsOf(this.Gamer.user.id)
      if (botPerms.has('readMessages') && botPerms.has('sendMessages') && botPerms.has('embedLinks')) {
        publicChannel.createMessage({ embed: embed.code })
      }
    }

    return modlogID
  }

  createNewID(logs: GamerModlog[]) {
    if (logs.length < 1) return 1

    let id = 1

    for (const log of logs) if (log.modlogID >= id) id = log.modlogID + 1

    return id
  }

  createEmbed(message: Message, user: User, logData: GamerModlog, language: TFunction) {
    let color = modlogTypes.WARN_COLOR
    let image = modlogTypes.WARN_IMAGE
    switch (logData.action) {
      case `ban`:
        color = modlogTypes.BAN_COLOR
        image = modlogTypes.BAN_IMAGE
        break
      case `unban`:
        color = modlogTypes.UNBAN_COLOR
        image = modlogTypes.UNBAN_IMAGE
        break
      case `mute`:
        color = modlogTypes.MUTE_COLOR
        image = modlogTypes.MUTE_IMAGE
        break
      case `unmute`:
        color = modlogTypes.UNMUTE_COLOR
        image = modlogTypes.UNMUTE_IMAGE
        break
      case `kick`:
        color = modlogTypes.KICK_COLOR
        image = modlogTypes.KICK_IMAGE
        break
    }

    const description = [
      `**${language(`common:MODERATOR`)}** ${message.author.username || ``} *(${message.author.id})*`,
      `**${language(`moderation/modlog:MEMBER`)}** ${user.username || ``} *(${user.id})*`,
      `**${language(`common:REASON`)}** ${logData.reason}`
    ]
    if (logData.duration) {
      description.push(
        `**${language(`moderation/modlog:DURATION`)}** ${this.Gamer.helpers.transform.humanizeMilliseconds(
          logData.duration
        )}`
      )
    }
    return new GamerEmbed()
      .setAuthor(this.Gamer.helpers.transform.toTitleCase(logData.action), user.avatarURL)
      .setColor(color)
      .setDescription(description.join(`\n`))
      .setThumbnail(image)
      .setFooter(language(`moderation/modlog:CASE`, { id: logData.modlogID }))
      .setTimestamp()
  }

  async processMutes() {
    const mutedLogs = await this.Gamer.database.models.modlog.find({ needsUnmute: true })

    const now = Date.now()
    for (const log of mutedLogs) {
      if (!log.duration) continue
      // If the time has not completed yet skip
      if (now < log.timestamp + log.duration) continue
      // Get the guild settings to get the mute role id
      const guildSettings = await this.Gamer.database.models.guild.findOne({ id: log.guildID })
      // If there is no guildsettings or no role id skip
      if (!guildSettings?.moderation.roleIDs.mute) continue
      // Since the time has fully elapsed we need to remove the role on the user
      this.Gamer.removeGuildMemberRole(log.guildID, log.userID, guildSettings?.moderation.roleIDs.mute)
      // Label this log as unmuted so we don't need to fetch it next time
      log.needsUnmute = false
      log.save()
    }
  }
}
