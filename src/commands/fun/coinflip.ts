import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'

const images = ['https://i.imgur.com/4viDc5c.png', 'https://i.imgur.com/OeSr2UA.png']

export default new Command([`coinflip`, `cf`], async (message, args, context) => {
  if (!message.guildID) return
  const Gamer = context.client as GamerClient

  const language = Gamer.getLanguage(message.guildID)

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const [choice, amountStr] = args
  if (!choice || !amountStr) return helpCommand.execute(message, [`coinflip`], { ...context, commandName: 'help' })

  if (
    choice.toLowerCase() !== language(`fun/coinflip:OPTION_NUMBER0`).toLowerCase() &&
    choice.toLowerCase() !== language(`fun/coinflip:OPTION_NUMBER1`).toLowerCase()
  )
    return message.channel.createMessage(language(`fun/coinflip:NEED_CHOICE`))

  const amount = parseInt(amountStr)
  if (!amount) return message.channel.createMessage(language(`fun/coinflip:NEED_AMOUNT`))

  const authorSettings =
    (await Gamer.database.models.user.findOne({ userID: message.author.id })) ||
    (await Gamer.database.models.user.create({ userID: message.author.id, guildIDs: [message.guildID] }))

  // Check if author can afford
  if (amount > authorSettings.leveling.currency)
    return message.channel.createMessage(language(`fun/coinflip:CANT_AFFORD`))

  // Coinflip
  const randomNumber = Math.floor(Math.random() * 2)
  const coinflip = language(`fun/coinflip:OPTION_NUMBER${randomNumber}`).toLowerCase()
  const win = choice.toLowerCase() === coinflip

  // Add/Deduct Coins
  if (win) {
    authorSettings.leveling.currency += amount
    authorSettings.save()
  } else {
    authorSettings.leveling.currency -= amount
    authorSettings.save()
  }

  // Create output embed
  const embed = new MessageEmbed()
    .setAuthor(message.author.username, message.author.avatarURL)
    .setImage(images[randomNumber])
    .setDescription(
      language(`fun/coinflip:RESULT`, {
        mention: message.author.mention,
        coinflip: coinflip,
        amount: win ? amount * 2 : amount,
        result: win ? language(`fun/coinflip:WIN`) : language(`fun/coinflip:LOSS`),
        emoji: constants.emojis.coin
      })
    )

  return message.channel.createMessage({ embed: embed.code })
})
