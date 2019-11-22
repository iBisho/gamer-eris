import mongoose from 'mongoose'

export default new mongoose.Schema({
  // The username of the account. Ex: Twitch username
  username: { type: String, required: true },
  // The type/platform of subscription. Ex: twitch, dlive etc...
  type: { type: String, required: true, lowercase: true },

  // All the listeners for this subscription. When we recieve a alert we send a message to all these listeners.
  subs: [
    {
      // The game is an optional setting that admins can add to filter out all streams from a user related to their game.
      game: { type: String, lowercase: true },
      // The guild id where this should be sent
      guildID: { type: String, required: true },
      // The channel id where this should be sent
      channelID: { type: String, required: true }
    }
  ],

  meta: {
    subscriptionUpdatedAt: {
      type: String,
      required: false,
      default: null
    }
  },
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})

export enum GamerSubscriptionType {
  TWITCH = 'twitch'
}

export interface GamerSubscription extends mongoose.Document {
  username: string
  createdAt: Date
  updatedAt: Date
  type: GamerSubscriptionType
  meta: {
    subscriptionUpdatedAt: Date
  }
  subs: SubscriptionListener[]
}

export interface SubscriptionListener {
  game?: string
  guildID: string
  channelID: string
}
