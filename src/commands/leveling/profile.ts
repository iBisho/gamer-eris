import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'
import { MessageEmbed } from 'helperis'
import { milliseconds } from '../../lib/types/enums/time'

export default new Command([`profile`, `p`, `prof`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const [id] = args
  const memberID = message.mentions.length ? message.mentions[0].id : id
  const member = (await Gamer.helpers.discord.fetchMember(message.member.guild, memberID)) || message.member
  const buffer = await Gamer.helpers.profiles.makeCanvas(message, member, Gamer)
  if (!buffer) return

  const fileName = `profile.jpg`
  const UNLOCK = language('leveling/profile:UNLOCK', {
    prefix: Gamer.guildPrefixes.get(message.guildID) || Gamer.prefix
  })

  const [guildSettings, missionData, upvote] = await Promise.all([
    await Gamer.database.models.guild.findOne({ id: member.guild.id }),
    await Gamer.database.models.mission.find({ userID: member.id }),
    await Gamer.database.models.upvote.findOne({
      userID: member.id,
      timestamp: { $gt: message.timestamp - milliseconds.HOUR * 12 }
    })
  ])

  const missions = Gamer.missions.map((mission, index) => {
    if (index > 2 && !upvote) return `${constants.emojis.questionMark} || ${UNLOCK} ||`
    const relevantMission = missionData.find(m => m.commandName === mission.commandName)
    if (!relevantMission) return `0 / ${mission.amount} : ${language(mission.title)} **[${mission.reward}] XP**`

    if (!relevantMission.completed)
      return `${relevantMission.amount} / ${mission.amount} : ${language(mission.title)} **[${mission.reward}] XP**`

    return `${constants.emojis.success}: ${language(mission.title)} **[${mission.reward}] XP**`
  })

  const embed = new MessageEmbed().attachFile(buffer, fileName)

  if (guildSettings && !guildSettings.xp.disableMissions) {
    embed
      .setDescription(missions.join('\n'))
      .setTitle(language(`leveling/profile:CURRENT_MISSIONS`))
      .setFooter(
        language(`leveling/profile:NEW_IN`, {
          time: Gamer.helpers.transform.humanizeMilliseconds(
            milliseconds.MINUTE * 30 - (Date.now() - Gamer.missionsStartTimestamp)
          )
        })
      )
  }

  const canAttachFile = Gamer.helpers.discord.checkPermissions(message.channel, Gamer.user.id, ['attachFiles'])
  if (!canAttachFile)
    return message.channel.createMessage(
      language(`leveling/profile:NEED_ATTACH_FILE`, { mention: message.author.mention })
    )

  const response = await message.channel.createMessage({ embed: embed.code }, { file: buffer, name: `profile.jpg` })

  const userSettings = await Gamer.database.models.user.findOne({
    userID: message.author.id
  })

  const backgroundID = userSettings?.profile.backgroundID || 1
  const backgroundData = constants.profiles.backgrounds.find(bg => bg.id === backgroundID)
  const isDefaultBackground = backgroundData && backgroundData.name === constants.profiles.defaultBackground
  const hasPermission = Gamer.helpers.discord.checkPermissions(message.channel, Gamer.user.id, [
    `addReactions`,
    `externalEmojis`,
    `readMessageHistory`
  ])

  if (hasPermission) {
    const reaction = Gamer.helpers.discord.convertEmoji(constants.emojis.discord, `reaction`)
    if (isDefaultBackground && reaction) response.addReaction(reaction).catch(() => undefined)
  }

  return Gamer.helpers.levels.completeMission(message.member, `profile`, message.guildID)
})
