import { Command } from 'yuuko'
import { UserSettings, Boost } from '../lib/types/settings'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`boostme`, `amiboosted`, `iamboosted`], async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const userSettings = (await Gamer.database.models.user.findOne({ userID: message.author.id })) as UserSettings | null
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
  // Buy a boost for the user using XP
  else {
    // If the user does not have enough xp to buy a boost cancel out
    if (userSettings.leveling.xp < 100) return message.channel.createMessage(language(`leveling/boostme:NEED_XP`))

    const newBoost = {
      name: language(`leveling/boostme:SMALL_BOOSTER`),
      active: true,
      multiplier: 5,
      timestamp: 60000 * 30,
      activatedAt: Date.now()
    }

    // Add an activated default booster to the user
    userSettings.leveling.boosts = userSettings.leveling.boosts.filter(
      boost => boost.timestamp && Date.now() < boost.timestamp
    )
    userSettings.leveling.boosts.push(newBoost)

    availableBoost = newBoost
  }

  userSettings.save()
  return message.channel.createMessage(
    language(`leveling/boostme:BOOSTED`, {
      name: availableBoost.name,
      multiplier: availableBoost.multiplier,
      prefix: Gamer.guildPrefixes.get(message.channel.guild.id) || Gamer.prefix
    })
  )
})
