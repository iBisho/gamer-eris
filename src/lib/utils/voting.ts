import database from '../../database/mongodb'
import { milliseconds } from '../types/enums/time'

export const weeklyVoteReset = async () => {
  const now = Date.now()

  const clientSettings = await database.models.client.findOne()
  if (!clientSettings?.weeklyVoteTimestamp) return

  const lastPlusOneWeek = clientSettings.weeklyVoteTimestamp + milliseconds.WEEK

  if (lastPlusOneWeek < now) return

  clientSettings.weeklyVoteTimestamp = lastPlusOneWeek
  clientSettings.save()

  database.models.upvote.updateMany({}, { weeklyCount: 0 }).exec()
}

export const vipExpiredCheck = async () => {
  const now = Date.now()
  const expiredGuildSettings = await database.models.guild.find({
    vip: { isVIP: true, registeredAt: { $lt: now - milliseconds.WEEK } }
  })

  const usersIDsToReset = [
    ...new Set(
      expiredGuildSettings.map(guildSettings => {
        guildSettings.vip.isVIP = false
        guildSettings.save()

        return guildSettings.vip.userID
      })
    )
  ]

  usersIDsToReset.forEach(userID => {
    const userSettings = await database.models.user.findOne({ userID })
    if (!userSettings) return

    userSettings.vip.isVIP = false
    userSettings.vip.guildsRegistered = userSettings.vip.guildsRegistered.filter(
      id => !expiredGuildSettings.some(guildSettings => guildSettings.id === id)
    )
  })
}
