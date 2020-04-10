/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'
import { TextChannel, NewsChannel } from 'eris'

export default new Command([`analyze`, `analytics`], async (message, _args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })

  // If they are using default settings, they won't be vip server
  if (!guildSettings?.vip.isVIP) return message.channel.createMessage(language(`vip/analyze:NEED_VIP`))

  // If the user does not have admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  // Alert the user that this can take time
  message.channel.createMessage(language(`vip/analyze:PATIENCE`))

  // Fetch all analytics for this guild
  const allAnalyticData = await Gamer.database.models.analytics.find({ guildID: message.guildID })

  let totalMessages = 0
  let membersJoined = 0
  let membersLeft = 0

  const channelMessages = new Map<string, number>()
  const userMessages = new Map<string, number>()

  const currentMonth = new Date().getMonth()

  for (const data of allAnalyticData) {
    // If not current month skip this. Will be aggregated and removed when processed.
    if (currentMonth !== new Date(data.timestamp).getMonth()) continue

    if (data.type === 'MESSAGE_CREATE') {
      totalMessages++

      const channelCount = channelMessages.get(data.channelID)
      channelMessages.set(data.channelID, channelCount ? channelCount + 1 : 1)

      const userCount = userMessages.get(data.userID)
      userMessages.set(data.userID, userCount ? userCount + 1 : 1)
    }

    if (data.type === 'MEMBER_ADDED') {
      membersJoined++
    }

    if (data.type === 'MEMBER_REMOVED') {
      membersLeft++
    }
  }

  const serverlogChannelIDs = [
    guildSettings.moderation.logs.modlogsChannelID,
    guildSettings.moderation.logs.publiclogsChannelID,
    guildSettings.moderation.logs.serverlogs.bot.channelID,
    guildSettings.moderation.logs.serverlogs.channels.channelID,
    guildSettings.moderation.logs.serverlogs.emojis.channelID,
    guildSettings.moderation.logs.serverlogs.members.channelID,
    guildSettings.moderation.logs.serverlogs.messages.channelID,
    guildSettings.moderation.logs.serverlogs.roles.channelID
  ]

  const relevantChannels = message.member.guild.channels
    .filter(channel => {
      if (!message.guildID || !message.member) return false

      // Skip non-text channels
      if (!(channel instanceof TextChannel) && !(channel instanceof NewsChannel)) return false
      // Skip verify channels
      if (channel.parentID === guildSettings.verify.categoryID) return false
      // Skip mail channels
      if (channel.parentID === guildSettings.mails.categoryID) return false
      // Skip server log channels
      if (serverlogChannelIDs.includes(channel.id)) return false

      return true
      // const everyoneRole = message.member.guild.roles.get(message.guildID)
      // const everyoneSendPerm = everyoneRole?.permissions.has('sendMessages')
      // const everyoneOverwrite = channel.permissionOverwrites.get(message.guildID)

      // if (everyoneOverwrite && everyoneOverwrite.allow & Constants.Permissions.sendMessages) return true
      // if (everyoneOverwrite && everyoneOverwrite.deny & Constants.Permissions.sendMessages) return false
      // if (everyoneOverwrite && everyoneOverwrite.allow & Constants.Permissions.readMessages) return true
      // if (everyoneOverwrite && everyoneOverwrite.deny & Constants.Permissions.readMessages) return false

      // return everyoneSendPerm || false
    })
    .map(channel => channel.id)

  const topChannels = [...channelMessages.keys()]
    .filter(id => message.member?.guild.channels.has(id))
    .sort((a, b) => channelMessages.get(b)! - channelMessages.get(a)!)
    .slice(0, 10)

  const leastActiveChannels = relevantChannels
    .sort((a, b) => (channelMessages.get(a) || 0) - (channelMessages.get(b) || 0))
    .slice(0, 10)

  const topUsers = [...userMessages.keys()].sort((a, b) => userMessages.get(b)! - userMessages.get(a)!).slice(0, 10)

  const NONE = language(`common:NONE`)

  const embed = new MessageEmbed()
    .setAuthor(message.member.guild.name, message.member.guild.iconURL)
    .addField(language(`vip/analyze:TOTAL_MESSAGES`), totalMessages.toString(), true)
    .addField(
      language(`vip/analyze:MEMBERS_STATS`),
      language(`vip/analyze:MEMBER_JOIN_LEAVE`, {
        joined: membersJoined,
        left: membersLeft,
        net: membersJoined - membersLeft
      }),
      true
    )
    .addBlankField()
    .addField(
      language(`vip/analyze:TOP_CHANNELS`),
      topChannels.map(id => `<#${id}> ${channelMessages.get(id)!}`).join('\n') || NONE,
      true
    )
    .addField(
      language(`vip/analyze:INACTIVE_CHANNELS`),
      leastActiveChannels.map(id => `<#${id}> ${channelMessages.get(id) || 0}`).join('\n') || NONE,
      true
    )
    .addField(
      language(`vip/analyze:TOP_USERS`),
      topUsers.map(id => `<@!${id}> ${userMessages.get(id)!}`).join('\n') || NONE,
      true
    )

  return message.channel.createMessage({ content: message.author.mention, embed: embed.code })
})
