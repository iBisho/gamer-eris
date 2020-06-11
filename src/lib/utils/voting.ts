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
