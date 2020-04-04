import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`8ball`, `8b`, `fortune`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  if (!args.length) return message.channel.createMessage(language(`fun/8ball:NO_ARGS`))

  message.channel.createMessage(language(`fun/8ball:REPLY_NUMBER${Math.floor(Math.random() * 12)}`))
  if (message.member) return Gamer.helpers.levels.completeMission(message.member, `8ball`, message.guildID)
})
