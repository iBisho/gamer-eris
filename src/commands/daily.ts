import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import constants from '../constants'
import { milliseconds } from '../lib/types/enums/time'

const dailyXPGlobalAmount = 10

export default new Command(`daily`, async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })
  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  // Check if on cooldown
  const cooldownID = `${message.author.id}.daily`
  const now = Date.now()
  const cooldown = Gamer.cooldowns.get(cooldownID)
  if (cooldown)
    return message.channel.createMessage(
      language(`leveling/daily:COOLDOWN`, {
        time: Gamer.helpers.transform.humanizeMilliseconds(cooldown - now)
      })
    )
  else Gamer.cooldowns.set(cooldownID, now + milliseconds.DAY)

  const userSettings =
    (await Gamer.database.models.user.findOne({ id: message.author.id })) ||
    (await Gamer.database.models.user.create({ userID: message.author.id }))

  userSettings.leveling.currency = userSettings.leveling.currency + 10
  userSettings.save()

  const dailyXP = guildSettings?.xp.daily || 10

  // Add XP to the member for the daily amount
  Gamer.helpers.levels.addLocalXP(message.member, dailyXP, true)
  // Add XP to the user for the global amount
  Gamer.helpers.levels.addGlobalXP(message.member, dailyXPGlobalAmount)

  // Respond telling the user how much they gained
  return message.channel.createMessage(
    language(`leveling/daily:SUCCESS`, {
      mention: message.author.mention,
      amount: dailyXP,
      emoji: constants.emojis.coin
    })
  )
})
