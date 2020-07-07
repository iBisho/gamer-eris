import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'
import { milliseconds } from '../../lib/types/enums/time'
import { upsertUser } from '../../database/mongoHandler'

const dailyXPAmount = 50
const dailyCoinsAmount = 100

export default new Command(`daily`, async (message, _args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  // Check if on cooldown
  const cooldownID = `${message.author.id}.daily`
  const now = Date.now()
  const cooldown = Gamer.cooldowns.get(cooldownID)
  // If they are on cooldown and the cooldown timestamp has not been over a day cancel the command
  if (cooldown)
    return message.channel.createMessage(
      language(`leveling/daily:COOLDOWN`, {
        time: Gamer.helpers.transform.humanizeMilliseconds(cooldown - now)
      })
    )
  else Gamer.cooldowns.set(cooldownID, now + milliseconds.DAY)

  const userSettings = await upsertUser(message.author.id, [message.member.guild.id])

  userSettings.leveling.currency = userSettings.leveling.currency + dailyCoinsAmount
  userSettings.save()

  // Add XP to the member for the daily amount
  Gamer.helpers.levels.addLocalXP(message.member, dailyXPAmount, true)
  // Add XP to the user for the global amount
  Gamer.helpers.levels.addGlobalXP(message.member, dailyXPAmount, true)

  // Respond telling the user how much they gained
  return message.channel.createMessage(
    language(`leveling/daily:SUCCESS`, {
      mention: message.author.mention,
      amount: dailyCoinsAmount,
      emoji: constants.emojis.coin
    })
  )
})
