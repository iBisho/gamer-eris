import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import constants from '../constants'

export default new Command([`balance`, `bal`, `wallet`, `money`, `coins`], async (message, _args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const userSettings =
    (await Gamer.database.models.user.findOne({ userID: message.author.id })) ||
    (await Gamer.database.models.user.create({ userID: message.author.id }))

  // Respond telling the user how much they have
  return message.channel.createMessage(
    language(`leveling/balance:SUCCESS`, {
      mention: message.author.mention,
      amount: userSettings.leveling.currency,
      emoji: constants.emojis.coin
    })
  )
})
