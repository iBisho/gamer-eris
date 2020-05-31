import database from '../../database/mongodb'
import { milliseconds } from '../types/enums/time'
import Gamer from '../..'
import constants from '../../constants'

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
    'vip.isVIP': true,
    'vip.registeredAt': { $lt: now - milliseconds.WEEK }
  })

  const gamerGuild = Gamer.guilds.get(constants.general.gamerServerID)
  if (!gamerGuild) return

  const nonBoostedGuildSettings = expiredGuildSettings.filter(async gs => {
    if (!gs.vip.userID) return true

    const member = await Gamer.helpers.discord.fetchMember(gamerGuild, gs.vip.userID)
    if (!member) return true

    return !member.roles.includes(constants.general.nitroBoosterRoleID)
  })

  const usersIDsToReset = [
    ...new Set(
      nonBoostedGuildSettings.map(guildSettings => {
        guildSettings.vip.isVIP = false
        // Reset VIP xp settings
        if (guildSettings.xp.perMessage || guildSettings.xp.perMinuteVoice) {
          guildSettings.xp.perMinuteVoice = 1
          guildSettings.xp.perMessage = 1
          if (Gamer.guildsXPPerMinuteVoice.has(guildSettings.id)) Gamer.guildsXPPerMinuteVoice.delete(guildSettings.id)
          if (Gamer.guildsXPPerMessage.has(guildSettings.id)) Gamer.guildsXPPerMessage.delete(guildSettings.id)
        }

        guildSettings.save()

        return guildSettings.vip.userID
      })
    )
  ]

  usersIDsToReset.forEach(async userID => {
    const userSettings = await database.models.user.findOne({ userID })
    if (!userSettings) return

    userSettings.vip.isVIP = false
    userSettings.vip.guildsRegistered = userSettings.vip.guildsRegistered.filter(
      id => !nonBoostedGuildSettings.some(guildSettings => guildSettings.id === id)
    )

    userSettings.save()
  })
}
