import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import constants from '../constants'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default new Command([`profile`, `p`, `prof`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

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

          if (relevantMission.amount < mission.amount)
            return `${relevantMission.amount} / ${mission.amount} : ${language(mission.title)} **[${
              mission.reward
            }] XP**`

          return `${constants.emojis.greenTick}: ${language(mission.title)} **[${mission.reward}] XP**`
        })
        .join('\n')
    )
    .attachFile(buffer, fileName)
    .setImage(`attachment://${fileName}`)

  const response = await message.channel.createMessage({ embed: embed.code }, { file: buffer, name: `profile.jpg` })

  const userSettings = await Gamer.database.models.user.findOne({
    id: message.channel.guild.id
  })

  const backgroundID = userSettings?.profile.backgroundID || 1

  const backgroundData = constants.profiles.backgrounds.find(bg => bg.id === backgroundID)

  const isDefaultBackground = backgroundData && backgroundData.name === constants.profiles.defaultBackground

  const reaction = Gamer.helpers.discord.convertEmoji(constants.emojis.discord, `reaction`)
  if (isDefaultBackground && reaction) response.addReaction(reaction)

  return Gamer.helpers.levels.completeMission(message.member, `profile`, message.channel.guild.id)
})
