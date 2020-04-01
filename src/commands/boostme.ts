import { Command } from 'yuuko'
import { Boost } from '../lib/types/settings'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`boostme`, `amiboosted`, `iamboosted`], async (message, _args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const userSettings = await Gamer.database.models.user.findOne({ userID: message.author.id })
  if (!userSettings) return

  // const [type] = args

  let availableBoost: Boost | undefined = undefined

  for (const boost of userSettings.leveling.boosts) {
    // If the user is already boosted then cancel out because we dont allow multiple boosts at the same time
    if (boost.active && boost.activatedAt && boost.timestamp) {
      // Check if this active boost has expired
      if (boost.activatedAt + boost.timestamp > message.timestamp)
        return message.channel.createMessage(language(`leveling/boostme:ALREADY_BOOSTED`, { name: boost.name }))

      // Since the boost expired we need to remove it
      userSettings.leveling.boosts = userSettings.leveling.boosts.filter(b => !b.active)
      await userSettings.save()
      continue
    }

    availableBoost = boost
    break
  }

  if (availableBoost) availableBoost.active = true
  // Buy a boost for the user using coins
  else {
    // If the user does not have enough coins to buy a boost cancel out
    if (userSettings.leveling.currency < 500)
      return message.channel.createMessage(language(`leveling/boostme:NEED_COINS`))

    const newBoost = {
      name: language(`leveling/boostme:SMALL_BOOSTER`),
      active: true,
      multiplier: 3,
      timestamp: 60000 * 30,
      activatedAt: Date.now()
    }

    // Add an activated default booster to the user
    userSettings.leveling.boosts = userSettings.leveling.boosts.filter(
      boost => boost.timestamp && Date.now() < boost.timestamp
    )
    userSettings.leveling.boosts.push(newBoost)

    // Remove 500 coins for the cost
    userSettings.leveling.currency -= 500

    availableBoost = newBoost
  }

  userSettings.save()
  return message.channel.createMessage(
    language(`leveling/boostme:BOOSTED`, {
      name: availableBoost.name,
      multiplier: availableBoost.multiplier,
      prefix: Gamer.guildPrefixes.get(message.guildID) || Gamer.prefix
    })
  )
})
