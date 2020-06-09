import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'
import { upsertUser } from '../../database/mongoHandler'

export default new Command([`pay`, `send`, `transfer`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const [userID, amountStr] = args
  const user = (await Gamer.helpers.discord.fetchUser(Gamer, userID)) || message.mentions[0]
  if (!user) return message.channel.createMessage(language(`leveling/pay:NEED_USER`))

  const amount = parseInt(amountStr)
  if (!amount) return message.channel.createMessage(language(`leveling/pay:NEED_AMOUNT`))

  const userSettings = await upsertUser(user.id, [message.guildID])
  const authorSettings = await upsertUser(message.author.id, [message.guildID])

  // Check if author can afford
  if (amount > authorSettings.leveling.currency)
    return message.channel.createMessage(language(`leveling/pay:CANT_AFFORD`))

  // Deduct amount from author and add it to user
  userSettings.leveling.currency += amount
  userSettings.save()
  authorSettings.leveling.currency -= amount
  authorSettings.save()

  // Create response telling how much was sent to whom
  return message.channel.createMessage(
    language(`leveling/pay:SUCCESS`, {
      mention: message.author.mention,
      user: user.mention,
      amount: amount,
      emoji: constants.emojis.coin
    })
  )
})
