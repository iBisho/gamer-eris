import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { sendMessage } from '../../lib/utils/eris'
import { MessageEmbed, userTag } from 'helperis'

export default new Command([`leaderboard`, `lb`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const [id, type] = args
  const memberID = message.mentions[0]?.id || id

  const member = memberID
    ? (await Gamer.helpers.discord.fetchMember(message.member.guild, memberID)) || message.member
    : message.member

  const globalTypes = [`g`, `global`, ...language(`common:GLOBAL_OPTIONS`, { returnObjects: true })]
  const voiceTypes = [`v`, `voice`, ...language(`common:VOICE_OPTIONS`, { returnObjects: true })]

  // Special needs for vip servers
  if (['334791529296035840'].includes(message.guildID)) {
    const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
    if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return
  }

  if (id === 'details') {
    if (!Gamer.vipGuildIDs.has(message.member.guild.id))
      return sendMessage(message.channel.id, language('leveling/leaderboard:VIP_DETAILS'))

    const starting = Number(type) || 0
    const results = await Gamer.database.models.member
      .find({ guildID: member.guild.id })
      .sort('-leveling.xp')
      .skip(starting)
      .limit(20)
    const embed = new MessageEmbed()
      .setAuthor(userTag(message.author), message.author.avatarURL)
      .setDescription(
        results
          .map(
            (result, index) =>
              `${index + 1 + starting}. <@!${result.memberID}> Level: ${result.leveling.level} Total XP: ${
                result.leveling.xp
              }`
          )
          .join('\n')
      )

    return sendMessage(message.channel.id, { embed: embed.code })
  }

  let buffer: Buffer | undefined
  if ((id && globalTypes.includes(id.toLowerCase())) || (type && globalTypes.includes(type.toLowerCase()))) {
    buffer = await Gamer.helpers.leaderboards.makeGlobalCanvas(message, member)
  } else if ((id && voiceTypes.includes(id.toLowerCase())) || (type && voiceTypes.includes(type.toLowerCase()))) {
    buffer = await Gamer.helpers.leaderboards.makeVoiceCanvas(message, member)
  } else {
    buffer = await Gamer.helpers.leaderboards.makeLocalCanvas(message, member)
  }

  if (!buffer) return

  return message.channel.createMessage('', { file: buffer, name: `leaderboard.jpg` })
})
