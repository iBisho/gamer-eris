/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'

export default new Command([`analyzechannel`, `analyticschannel`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const helpCommand = Gamer.commandForName('help')
  if (!args.length) return helpCommand?.execute(message, [`analyzechannel`], context)

  const [id, startNumber, endNumber] = args
  const channel = message.member.guild.channels.get(message.channelMentions.length ? message.channelMentions[0] : id)
  if (!channel) return helpCommand?.execute(message, [`analyzechannel`], context)

  const startDay = Number(startNumber) || 0
  const endDay = Number(endNumber) || 0

  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })

  // If they are using default settings, they won't be vip server
  if (!guildSettings?.vip.isVIP) return message.channel.createMessage(language(`vip/analyze:NEED_VIP`))

  // If the user does not have admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  // Alert the user that this can take time
  message.channel.createMessage(language(`vip/analyze:PATIENCE`))

  // Fetch all analytics for this guild
  const allAnalyticData = await Gamer.database.models.analytics.find({ channelID: channel.id })

  let totalMessages = 0

  const channelMessages = new Map<string, number>()
  const userMessages = new Map<string, number>()

  const currentMonth = new Date().getMonth()

  for (const data of allAnalyticData) {
    const date = new Date(data.timestamp)
    const day = date.getDate()
    const month = date.getMonth()
    // If not current month skip. Will be aggregated and removed when processed.
    if (month !== currentMonth) continue
    // If filters are provided
    if (startDay && day < startDay) continue
    if (endDay && day > endDay) continue

    if (data.type === 'MESSAGE_CREATE') {
      totalMessages++

      const channelCount = channelMessages.get(data.channelID)
      channelMessages.set(data.channelID, channelCount ? channelCount + 1 : 1)

      const userCount = userMessages.get(data.userID)
      userMessages.set(data.userID, userCount ? userCount + 1 : 1)
    }
  }

  const topUsers = [...userMessages.keys()].sort((a, b) => userMessages.get(b)! - userMessages.get(a)!).slice(0, 10)

  const NONE = language(`common:NONE`)
  const embed = new MessageEmbed()
    .setAuthor(message.member.guild.name, message.member.guild.iconURL)
    .addField(language(`vip/analyze:TOTAL_MESSAGES`), totalMessages.toString(), true)
    .addField(
      language(`vip/analyze:TOP_USERS`),
      topUsers.map(id => `<@!${id}> ${userMessages.get(id)!}`).join('\n') || NONE,
      true
    )

  return message.channel.createMessage({ content: message.author.mention, embed: embed.code })
})
