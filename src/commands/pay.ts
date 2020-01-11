import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import constants from '../constants'

export default new Command([`pay`, `send`, `transfer`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const language = Gamer.getLanguage(message.channel.guild.id)

  const [userID, amountStr] = args
  const user = Gamer.users.get(userID) || message.mentions[0]
  if (!user) return message.channel.createMessage(language(`leveling/pay:NEED_USER`))

  const amount = parseInt(amountStr)
  if (!amount) return message.channel.createMessage(language(`leveling/pay:NEED_AMOUNT`))

  const userSettings =
    (await Gamer.database.models.user.findOne({ userID: user.id })) ||
    (await Gamer.database.models.user.create({ userID: user.id }))
  const authorSettings =
    (await Gamer.database.models.user.findOne({ userID: message.author.id })) ||
    (await Gamer.database.models.user.create({ userID: message.author.id }))

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
