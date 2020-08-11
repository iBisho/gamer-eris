import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'
import { sendMessage } from '../../lib/utils/eris'

const allEmojis = [
  constants.emojis.snap,
  constants.emojis.slam,
  constants.emojis.dab,
  constants.emojis.success,
  constants.emojis.gamerHeart,
  constants.emojis.gamerHug,
  constants.emojis.gamerOnFire,
  constants.emojis.gamerCry,
  constants.emojis.bite,
  constants.emojis.pat,
  constants.emojis.poke,
  constants.emojis.lmao,
  constants.emojis.tantrum,
  constants.emojis.furious,
  constants.emojis.hurray,
  constants.emojis.starry,
  constants.emojis.heartthrob,
  constants.emojis.huh,
  constants.emojis.toastspinning,
  constants.emojis.twohundretIQ,
  constants.emojis.RemDance,
  constants.emojis.Aquaaah,
  constants.emojis.NezukoDance
]

export default new Command([`slots`, `slotmachine`], async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.guildID)
  const userSettings = await Gamer.database.models.user.findOne({ userID: message.author.id })
  if (!userSettings) return

  const emojis = []

  // This allows us to add as many emojis we want but the odds remain the same. More unique emojis help spam feel less spam and more users want to join gamer server to get access to those emojis.
  while (emojis.length < 10) {
    emojis.push(Gamer.helpers.utils.chooseRandom(allEmojis))
  }

  const row1 = []
  const row2 = []
  const row3 = []

  for (let i = 0; i < 9; i++) {
    if (row1.length < 3) row1.push(Gamer.helpers.utils.chooseRandom(emojis))
    else if (row2.length < 3) row2.push(Gamer.helpers.utils.chooseRandom(emojis))
    else row3.push(Gamer.helpers.utils.chooseRandom(emojis))
  }

  const winningSet = new Set(row2)
  const topSet = new Set(row1)
  const bottomSet = new Set(row3)
  const upvote = await Gamer.database.models.upvote.findOne({ userID: message.author.id })
  const isLucky = upvote && upvote.luckySlots >= 1
  const multiplier = isLucky ? 3 : 1

  let response = 'fun/slots:LOSER'
  let finalAmount = 1
  if (upvote && winningSet.size !== 3) upvote.luckySlots -= 1

  const isSupporter = Gamer.guilds.get(constants.general.gamerServerID)?.members.get(message.author.id)

  // If they lost all three are unique emojis
  if (winningSet.size === 3) {
    if (userSettings.currency > 0) {
      if (userSettings.currency < 2) userSettings.currency -= 1
      else {
        userSettings.currency -= 2
        response = 'fun/slots:LOSER_MULTI'
      }
    } else {
      userSettings.currency += 1
      response = 'fun/slots:FREEBIE'
    }
  }
  // If 2 of them were the same emoji
  else if (winningSet.size === 2) {
    response = 'fun/slots:WINNER_PARTIAL'
    finalAmount = multiplier * 10
    userSettings.currency += finalAmount * (isSupporter ? 2 : 1)
    if (upvote && isLucky) upvote.luckySlots -= 1
  }
  // If all three emojis are the same. WINNER!
  else {
    // All three rows were winners
    if (bottomSet.size === 1 && topSet.size === 1) {
      const winningEmoji = [...winningSet][0]
      // All 9 emojis are the same
      if (winningEmoji === [...topSet][0] && winningEmoji === [...bottomSet][0]) {
        response = 'fun/slots:WINNER_COMPLETE'
        finalAmount = multiplier * 5000
        userSettings.currency += finalAmount * (isSupporter ? 2 : 1)
      }
      // The rows are different
      else {
        response = 'fun/slots:WINNER_LUCKY'
        finalAmount = multiplier * 1000
        userSettings.currency += finalAmount * (isSupporter ? 2 : 1)
      }
    }
    // 2 rows were all the same emoji
    else if (bottomSet.size === 1 || topSet.size === 1) {
      response = 'fun/slots:WINNER_MULTIPLE'
      finalAmount = multiplier * 500
      userSettings.currency += finalAmount * (isSupporter ? 2 : 1)
    }
    // Only one row was the same
    else {
      response = 'fun/slots:WINNER_FULL'
      finalAmount = multiplier * 100
      userSettings.currency += finalAmount * (isSupporter ? 2 : 1)
    }
  }

  userSettings.save()

  const details = [
    language(response, { mention: message.author.mention, amount: finalAmount, emoji: constants.emojis.coin })
  ]
  if (isSupporter && winningSet.size < 3) details.push(language('fun/slots:DOUBLE_REWARD', { amount: finalAmount * 2 }))
  details.push(row1.join(' | '), row2.join(' | '), row3.join(' | '))

  if (!Gamer.helpers.discord.checkPermissions(message.channel, Gamer.user.id, ['externalEmojis']))
    return sendMessage(message.channel.id, language('fun/slots:MISSING_PERM'))

  if (message.member && message.guildID) Gamer.helpers.levels.completeMission(message.member, 'slots', message.guildID)
  return message.channel.createMessage(details.join('\n'))
})
