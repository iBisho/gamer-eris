import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`leaderboard`, `lb`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || !message.member) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
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
  if ((id && globalTypes.includes(id.toLowerCase())) || (type && globalTypes.includes(type.toLowerCase()))) {
    buffer = await Gamer.helpers.leaderboards.makeGlobalCanvas(message, member, NO_POINTS, NOT_ENOUGH)
  } else if ((id && voiceTypes.includes(id.toLowerCase())) || (type && voiceTypes.includes(type.toLowerCase()))) {
    buffer = await Gamer.helpers.leaderboards.makeVoiceCanvas(message, member, NO_POINTS, NOT_ENOUGH)
  } else {
    buffer = await Gamer.helpers.leaderboards.makeLocalCanvas(message, member, NO_POINTS, NOT_ENOUGH)
  }

  if (!buffer) return

  message.channel.createMessage('', { file: buffer, name: `leaderboard.jpg` })
})
