import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import constants from '../constants'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { TenorGif } from '../lib/types/tenor'
import fetch from 'node-fetch'

const searchCriteria = [
  { name: 'wedding folder', cost: 5 },
  { name: 'wedding budget', cost: 10 },
  { name: 'wedding party', cost: 10 },
  { name: 'guest list', cost: 10 },
  { name: 'planner', cost: 500 },
  { name: 'wedding hall', cost: 1000 },
  { name: 'gamer bot', cost: 10 },
  { name: 'photographer', cost: 500 },
  { name: 'engagement party', cost: 1000 },
  { name: 'jesters', cost: 500 },
  { name: 'caterers', cost: 500 },
  { name: 'wedding dress', cost: 1000 },
  { name: 'wedding website', cost: 100 },
  { name: 'share social media', cost: 100 },
  { name: 'pretty font', cost: 200 },
  { name: 'vaccination shots', cost: 300 },
  { name: "bridesmaid's dresses.", cost: 1000 },
  { name: 'wedding invitations', cost: 200 },
  { name: 'wedding chairs', cost: 200 },
  { name: 'florist', cost: 500 },
  { name: 'limo', cost: 300 },
  { name: 'dinner venue', cost: 500 },
  { name: 'wedding cake', cost: 300 },
  { name: 'wedding shoes', cost: 1000 },
  { name: 'hair and makeup artists', cost: 500 },
  { name: 'dj', cost: 500 },
  { name: 'wedding ring', cost: 6000 },
  { name: 'slow dance', cost: 1000 },
  { name: 'slow dance', cost: 1000 },
  { name: 'marriage license', cost: 20 },
  { name: 'assigned seats', cost: 10 },
  { name: 'bridesmaids gifts', cost: 500 },
  { name: 'wedding vows', cost: 10 },
  { name: 'haircut', cost: 20 },
  { name: 'hair dye', cost: 20 },
  { name: 'painful waxing', cost: 20 },
  { name: 'dobby sock', cost: 1 }
]

export default new Command(`shopwedding`, async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const marriage = await Gamer.database.models.marriage
    .findOne()
    .or([{ authorID: message.author.id }, { spouseID: message.author.id, accepted: true }])

  if (!marriage) return message.channel.createMessage('fun/shopwedding:NOT_MARRIED')

  const item = searchCriteria[marriage.weddingShopCounter + 1]

  // If no settings for the user they wont have any coins to spend anyway
  const userSettings = await Gamer.database.models.user.findOne({ userID: message.author.id })
  if (!userSettings)
    return message.channel.createMessage(
      language(`fun/shopwedding:NEED_COINS`, {
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
          language(`fun/shopwedding:NEED_COINS`, {
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
        language(`fun/shopwedding:NEED_COINS`, {
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

  const SHOPPING_LIST: string[] = language('fun/shopwedding:SHOPPING_LIST', {
    mention: message.author.mention,
    coins: constants.emojis.coin,
    returnObjects: true
  })

  if (SHOPPING_LIST.length === marriage.weddingShopCounter)
    return message.channel.createMessage(language('fun/shopwedding:COMPLETE'))

  const shoppingList = SHOPPING_LIST.map(
    (i, index) =>
      `${index <= marriage.weddingShopCounter + 1 ? `✅` : `📝`} ${index}. ${i} ${searchCriteria[index].cost} ${
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

  const embed = new GamerEmbed()
    .setAuthor(message.member.nick || message.author.username, message.author.avatarURL)
    .setDescription(shoppingList.join('\n'))

  if (!Gamer.guildsDisableTenor.has(message.channel.guild.id)) {
    const data: TenorGif | undefined = await fetch(
      `https://api.tenor.com/v1/search?q=${item.name}&key=LIVDSRZULELA&limit=50`
    )
      .then(res => res.json())
      .catch(() => undefined)

    const randomResult = data?.results.length ? Gamer.helpers.utils.chooseRandom(data.results) : undefined
    const [media] = randomResult ? randomResult.media : []
    if (media) embed.setImage(media.gif.url).setFooter(`Via Tenor`)
  }

  marriage.weddingShopCounter++
  marriage.love++
  marriage.step++
  marriage.save()

  message.channel.createMessage({ embed: embed.code })
  if (marriage.weddingShopCounter + 1 !== SHOPPING_LIST.length) return

  message.channel.createMessage(language(`fun/shopwedding:CONGRATS`, { mention: message.author.mention }))

  // The shopping is complete
  const completedEmbed = new GamerEmbed()
    .setAuthor(message.member.nick || message.author.username, message.author.avatarURL)
    .setImage('https://i.imgur.com/Dx9Z2hq.jpg')
  return message.channel.createMessage({ embed: completedEmbed.code })
})
