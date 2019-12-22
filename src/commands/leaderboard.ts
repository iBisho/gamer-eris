import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`leaderboard`, `lb`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const [id, type] = args
  const memberID = message.mentions.length ? message.mentions[0].id : id

  const member = message.channel.guild.members.get(memberID) || message.member
  if (!member) return

  const globalTypes = [`g`, `global`, ...language(`common:GLOBAL_OPTIONS`, { returnObjects: true })]
  const voiceTypes = [`v`, `voice`, ...language(`common:VOICE_OPTIONS`, { returnObjects: true })]

  let buffer: Buffer | undefined
  if ((id && globalTypes.includes(id.toLowerCase())) || (type && globalTypes.includes(type.toLowerCase()))) {
    buffer = await Gamer.helpers.leaderboards.makeGlobalCanvas(message, member)
  } else if ((id && voiceTypes.includes(id.toLowerCase())) || (type && voiceTypes.includes(type.toLowerCase()))) {
    buffer = await Gamer.helpers.leaderboards.makeVoiceCanvas(message, member)
  } else {
    buffer = await Gamer.helpers.leaderboards.makeLocalCanvas(message, member)
  }

  if (!buffer) return

  message.channel.createMessage('', { file: buffer, name: `leaderboard.jpg` })
})
