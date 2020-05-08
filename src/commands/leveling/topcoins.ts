import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`topcoins`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const [id, type] = args
  const memberID = message.mentions.length ? message.mentions[0].id : id

  const member = (await Gamer.helpers.discord.fetchMember(message.member.guild, memberID)) || message.member

  const globalTypes = [`g`, `global`, ...language(`common:GLOBAL_OPTIONS`, { returnObjects: true })]

  const buffer =
    (id && globalTypes.includes(id.toLowerCase())) || (type && globalTypes.includes(type.toLowerCase()))
      ? await Gamer.helpers.leaderboards.makeGlobalCoinsCanvas(message, member)
      : await Gamer.helpers.leaderboards.makeLocalCoinsCanvas(message, member)

  if (!buffer) return

  message.channel.createMessage('', { file: buffer, name: `leaderboard.jpg` })
})
