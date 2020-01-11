import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import constants from '../constants'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { milliseconds } from '../lib/types/enums/time'

export default new Command([`profile`, `p`, `prof`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const language = Gamer.getLanguage(message.channel.guild.id)

  const [id] = args
  const memberID = message.mentions.length ? message.mentions[0].id : id

  const member = message.channel.guild.members.get(memberID) || message.member

  const buffer = await Gamer.helpers.profiles.makeCanvas(message, member, Gamer)
  if (!buffer) return

  const fileName = `profile.jpg`

  const missionData = await Gamer.database.models.mission.find({
    userID: member.id
  })

  const embed = new GamerEmbed()
    .setTitle(language(`leveling/profile:CURRENT_MISSIONS`))
    .setDescription(
      Gamer.missions
        .map(mission => {
          const relevantMission = missionData.find(m => m.commandName === mission.commandName)
          if (!relevantMission) return `0 / ${mission.amount} : ${language(mission.title)} **[${mission.reward}] XP**`

          if (!relevantMission.completed)
            return `${relevantMission.amount} / ${mission.amount} : ${language(mission.title)} **[${
              mission.reward
            }] XP**`

          return `${constants.emojis.greenTick}: ${language(mission.title)} **[${mission.reward}] XP**`
        })
        .join('\n')
    )
    .attachFile(buffer, fileName)
    .setFooter(
      language(`leveling/profile:NEW_IN`, {
        time: Gamer.helpers.transform.humanizeMilliseconds(
          milliseconds.MINUTE * 30 - (Date.now() - Gamer.missionsStartTimestamp)
        )
      })
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
    if (message.channel.permissionsOf(Gamer.user.id).has('addReactions') && isDefaultBackground && reaction)
      response.addReaction(reaction).catch(() => undefined)
  }

  return Gamer.helpers.levels.completeMission(message.member, `profile`, message.channel.guild.id)
})
