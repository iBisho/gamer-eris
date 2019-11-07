import { Command } from 'yuuko'
import { UserSettings, GuildSettings, Boost } from '../lib/types/settings'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`boostme`, `amiboosted`, `iamboosted`], async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || !message.member) return

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : 'en-US')
  if (!language) return

  const userSettings = (await Gamer.database.models.user.findOne({ userID: message.author.id })) as UserSettings | null
  if (!userSettings) return

  // const [type] = args

  let availableBoost: Boost | undefined = undefined
  for (const boost of userSettings.leveling.boosts) {
    // If the user is already boosted then cancel out because we dont allow multiple boosts at the same time
    if (boost.active)
      return message.channel.createMessage(language(`leveling/boostme:ALREADY_BOOSTED`, { name: boost.name }))

    availableBoost = boost
  }

  if (availableBoost) availableBoost.active = true
  else {
    // If the user did not want to force
    // if (type.toLowerCase() !== 'buy') return message.channel.createMessage(language(`leveling/boostme:NO_BOOSTS`))

    // Buy a boost for the user using XP
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
    userSettings.leveling.boosts.filter(boost => boost.timestamp && Date.now() < boost.timestamp).push(newBoost)
    availableBoost = newBoost
  }

  userSettings.save()
  return message.channel.createMessage(
    language(`leveling/boostme:BOOSTED`, {
      name: availableBoost.name,
      multiplier: availableBoost.multiplier,
      prefix: guildSettings?.prefix || Gamer.prefix
    })
  )
})
