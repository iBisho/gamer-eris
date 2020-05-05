import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'
import { MessageEmbed } from 'helperis'
import { TenorGif } from '../../lib/types/tenor'
import fetch from 'node-fetch'

const searchCriteria = [
  { name: 'career', cost: -500 },
  { name: 'house', cost: 67 },
  { name: 'tesla car', cost: 33 },
  { name: 'gas station', cost: 10 },
  { name: 'electricity bill', cost: 16 },
  { name: 'water bill', cost: 3 },
  { name: 'groceries', cost: 6 },
  { name: 'romantic dinner', cost: 100 },
  { name: 'conversation', cost: 0 }
]

export default new Command(`life`, async (message, _args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const marriage = await Gamer.database.models.marriage
    .findOne()
    .or([{ authorID: message.author.id }, { spouseID: message.author.id, accepted: true }])
  if (!marriage) return message.channel.createMessage(language('fun/life:NOT_MARRIED'))

  const item = searchCriteria[marriage.lifeCounter]
  if (!item) return message.channel.createMessage(language(`fun/life:COMPLETE`))
  // If no settings for the user they wont have any coins to spend anyway
  const userSettings = await Gamer.database.models.user.findOne({ userID: message.author.id })
  if (!userSettings)
    return message.channel.createMessage(
      language(`fun/life:NEED_COINS`, {
        emoji: constants.emojis.coin,
        cost: item.cost,
        needed: item.cost
      })
    )

  if (userSettings.leveling.currency < item.cost) {
    // If not enough check if the marriage is accepted and combined the two users coins
    if (marriage.accepted) {
      const spouseSettings = await Gamer.database.models.user.findOne({ userID: message.author.id })
      if (!spouseSettings) return

      if (userSettings.leveling.currency + spouseSettings.leveling.currency < item.cost)
        return message.channel.createMessage(
          language(`fun/life:NEED_COINS`, {
            emoji: constants.emojis.coin,
            cost: item.cost,
            needed: item.cost - (userSettings.leveling.currency + spouseSettings.leveling.currency)
          })
        )

      // Update the users currency
      const leftover = item.cost - userSettings.leveling.currency
      userSettings.leveling.currency = 0
      spouseSettings.leveling.currency -= leftover
      userSettings.save()
      spouseSettings.save()
    }
    // Since the marriage hasnt been accepted yet we cancel out since the user doesnt have enough coins
    else
      return message.channel.createMessage(
        language(`fun/life:NEED_COINS`, {
          emoji: constants.emojis.coin,
          cost: item.cost,
          needed: item.cost - userSettings.leveling.currency
        })
      )
  } else {
    // The user has enough coins to buy this so just simply take the cost off
    userSettings.leveling.currency -= item.cost
    userSettings.save()
  }

  const SHOPPING_LIST: string[] = language('fun/life:SHOPPING_LIST', {
    mention: message.author.mention,
    coins: constants.emojis.coin,
    returnObjects: true
  })

  if (SHOPPING_LIST.length === marriage.lifeCounter) return message.channel.createMessage(language('fun/life:COMPLETE'))

  const shoppingList = SHOPPING_LIST.map(
    (i, index) =>
      `${index <= marriage.lifeCounter ? `✅` : `📝`} ${index + 1}. ${i} ${searchCriteria[index].cost} ${
        constants.emojis.coin
      }`
  )

  while (shoppingList.length > 3) {
    const secondItem = shoppingList[1]
    // If the second item is done the first will also be done so remove the first
    if (secondItem.startsWith('✅')) {
      shoppingList.shift()
      continue
    }

    // If there is only 1 check or less, remove the last item
    shoppingList.pop()
  }

  const embed = new MessageEmbed()
    .setAuthor(message.member?.nick || message.author.username, message.author.avatarURL)
    .setDescription(shoppingList.join('\n'))

  if (!Gamer.guildsDisableTenor.has(message.guildID)) {
    const data: TenorGif | undefined = await fetch(
      `https://api.tenor.com/v1/search?q=${item.name}&key=LIVDSRZULELA&limit=50`
    )
      .then(res => res.json())
      .catch(() => undefined)

    const randomResult = data?.results?.length ? Gamer.helpers.utils.chooseRandom(data.results) : undefined
    const [media] = randomResult ? randomResult.media : []
    if (media) embed.setImage(media.gif.url).setFooter(`Via Tenor`)
  }

  marriage.lifeCounter++
  marriage.love++
  marriage.save()

  message.channel.createMessage({ embed: embed.code })
  if (marriage.lifeCounter !== SHOPPING_LIST.length) return

  // The shopping is complete
  const completedEmbed = new MessageEmbed()
    .setAuthor(message.member?.nick || message.author.username, message.author.avatarURL)
    .setDescription(language(`fun/life:CONGRATS`, { mention: message.author.mention }))
    .setImage('https://i.imgur.com/LQtEyux.png')
  return message.channel.createMessage({ content: message.author.mention, embed: completedEmbed.code })
})
