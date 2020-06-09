import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'
import { upsertUser } from '../../database/mongoHandler'

export default new Command([`balance`, `bal`, `wallet`, `money`, `coins`], async (message, _args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const userSettings = await upsertUser(message.author.id, [message.guildID])

  // Respond telling the user how much they have
  return message.channel.createMessage(
    language(`leveling/balance:SUCCESS`, {
      mention: message.author.mention,
      amount: userSettings.leveling.currency.toLocaleString(),
      emoji: constants.emojis.coin
    })
  )
})
