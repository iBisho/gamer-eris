import api from './api'
import database from '../../database/mongodb'
import { GamerSubscriptionType } from '../../database/schemas/subscription'
import config from '../../../config'

// Twitch Webhooks subscriptions expires in 30 days.
// https://dev.twitch.tv/docs/api/webhooks-reference#subscribe-tounsubscribe-from-events
const MAX_SUBSCRIPTION_TIME_SECONDS = 2000
// const MAX_SUBSCRIPTION_TIME_SECONDS = 864000

// Every 2 minutes
const CRON_INTERVAL_MS = 2 * 60 * 1000

export async function runCronSubscribe() {
  const unfullfilledSubscriptions = await database.models.subscription.find({
    type: GamerSubscriptionType.TWITCH,
    $or: [
      {
        'meta.subscriptionExpiresAt': null
      },
      {
        'meta.subscriptionExpiresAt': {
          $lte: new Date()
        }
      }
    ],
    'meta.retries': {
      // After 10 retries, let's consider this subscription stuck.
      // Maybe alert developers?
      $lte: 10
    }
  })

  for (const stream of unfullfilledSubscriptions) {
    try {
      // Let's find this userID first
      const result = await api.users.byLogin(stream.username)

      // Compare by checking user name lowercase.
      // Should we also check display names?
      // Not sure. Display names *might* not be unique.
      const user = result.users.find(user => user.name.toLowerCase() === stream.username.toLowerCase())
      const userID = user?._id

      if (!userID) throw new Error('User not found')

      // This is the information that we will check later to see if our webhook subscription was successful.
      const subscriptionTopic = `https://api.twitch.tv/helix/streams?user_id=${userID}`

      const success = await api.webhooks.hub.create({
        'hub.callback': config.twitch.webhookCallback,
        'hub.mode': 'subscribe',
        'hub.topic': subscriptionTopic,
        'hub.lease_seconds': MAX_SUBSCRIPTION_TIME_SECONDS
      })

      if (!success) throw new Error('Failed to create webhook')

      stream.meta.subscriptionTopic = subscriptionTopic
      stream.meta.userID = userID
      await stream.save()
    } catch (e) {
      console.warn('Error while subscription to twitch ', stream.username, e)
      // Marked as failed once. Retry again later.
      // This might be useful later to know how many subscriptions are getting stuck
      stream.meta.retries = stream.meta.retries + 1
      stream.save()
      continue
    }
  }

  // Very important: This cron isn't supposed to be syncronized with the clock
  // Next one should run after this one is done plus a delay of CRON_INTERVAL_MS
  // This is to avoid race condition.
  setTimeout(runCronSubscribe, CRON_INTERVAL_MS)
}

export default () => {
  // Start subscribe crons
  runCronSubscribe()
}
