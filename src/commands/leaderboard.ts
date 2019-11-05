import { Command } from 'yuuko'
import { GuildSettings, UserSettings } from '../lib/types/settings'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import constants from '../constants'
import UserDefaults from '../constants/settings/user'

export default new Command([`leaderboard`, `lb`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || !message.member) return

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : `en-US`)
  if (!language) return

  const [id, type] = args
  const memberID = message.mentions.length ? message.mentions[0].id : id

  const member = message.channel.guild.members.get(memberID) || message.member
  if (!member) return

  const globalTypes = [`g`, `global`, ...language(`common:GLOBAL_OPTIONS`, { returnObjects: true })]
  const voiceTypes = [`v`, `voice`, ...language(`common:VOICE_OPTIONS`, { returnObjects: true })]

  const NO_POINTS = language(`leveling/leaderboard:NO_POINTS`, { member: member.mention })
  const NOT_ENOUGH = language(`leveling/leaderboard:NOT_ENOUGH`)

  let buffer: Buffer | undefined
  if (globalTypes.includes(id.toLowerCase()) || globalTypes.includes(type.toLowerCase())) {
    buffer = await Gamer.helpers.leaderboards.makeGlobalCanvas(message, member, NO_POINTS, NOT_ENOUGH)
  } else if (voiceTypes.includes(id.toLowerCase()) || voiceTypes.includes(type.toLowerCase())) {
    buffer = await Gamer.helpers.leaderboards.makeVoiceCanvas(message, member, NO_POINTS, NOT_ENOUGH)
  } else {
    buffer = await Gamer.helpers.leaderboards.makeLocalCanvas(message, member, NO_POINTS, NOT_ENOUGH)
  }

  if (!buffer) return

  const response = await message.channel.createMessage('', { file: buffer, name: `profile.jpg` })

  const userSettings =
    ((await Gamer.database.models.user.findOne({
      id: member.id
    })) as UserSettings) || UserDefaults

  const backgroundData = constants.profiles.backgrounds.find(bg => bg.id === userSettings.profile.backgroundID)

  const isDefaultBackground = backgroundData && backgroundData.url === constants.profiles.defaultBackground

  const reaction = Gamer.helpers.discord.convertEmoji(constants.emojis.discord, `reaction`)
  if (isDefaultBackground && reaction) response.addReaction(reaction)
})
