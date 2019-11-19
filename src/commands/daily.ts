import { Command } from 'yuuko'
import GuildDefaults from '../constants/settings/guild'
import { GuildSettings, UserSettings } from '../lib/types/settings'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import constants from '../constants'
import { milliseconds } from '../lib/types/enums/time'

const dailyXPGlobalAmount = 10

export default new Command(`daily`, async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || !message.member) return

  const guildSettings =
    ((await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) as GuildSettings | null) ||
    GuildDefaults
  const language = Gamer.i18n.get(guildSettings.language)
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

  const userSettings = ((await Gamer.database.models.user.findOne({ id: message.author.id })) ||
    new Gamer.database.models.user({ userID: message.author.id })) as UserSettings

  userSettings.leveling.currency = userSettings.leveling.currency + 10
  userSettings.save()

  // Add XP to the member for the daily amount
  Gamer.helpers.levels.addLocalXP(message.member, guildSettings.xp.daily, true, language(`leveling/xp:ROLE_ADD_REASON`))
  // Add XP to the user for the global amount
  Gamer.helpers.levels.addGlobalXP(message.member, dailyXPGlobalAmount)

  // Respond telling the user how much they gained
  return message.channel.createMessage(
    language(`leveling/daily:SUCCESS`, {
      mention: message.author.mention,
      amount: guildSettings.xp.daily,
      emoji: constants.emojis.currency
    })
  )
})
