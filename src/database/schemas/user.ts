import mongoose from 'mongoose'

export default new mongoose.Schema({
  userID: { type: String, required: true, index: true },
  guildIDs: { type: [String], default: [], index: true },
  backgroundID: { type: Number, default: 1 },
  theme: { type: String, default: `white` },
  profile: {
    // The id number of the background that the user has equipped
    backgroundID: { type: Number, default: 1 },
    // The theme color of the profile card
    theme: { type: String, default: `white` }
  },
  afkEnabled: Boolean,
  afkMessage: {
    type: String,
    default: `Hi 👋, I am AFK at the moment. I will get back to you as soon as possible. 😄`
  },
  afk: {
    // Whether the afk message should be sent when someone @ the user
    enabled: Boolean,
    // The message to send when the user is afk and someone @mentions the user. Can be JSON string for embeds
    message: { type: String, default: `Hi 👋, I am AFK at the moment. I will get back to you as soon as possible. 😄` }
  },
  isVIP: Boolean,
  vipGuildsRegistered: [String],
  vip: {
    // Whether or not the user is a vip user
    isVIP: Boolean,
    // The guilds this user has registered as VIP
    guildsRegistered: [String]
  },
  boosts: [
    {
      active: Boolean,
      activatedAt: Number,
      name: { type: String, required: true },
      multiplier: { type: Number, default: 0 },
      timestamp: { type: Number }
    }
  ],
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  currency: { type: Number, default: 0 },
  leveling: {
    boosts: [
      {
        // Whether or not this boost is currently active.
        active: Boolean,
        // The timestamp when it was activated. Used to filter our old expired boosts
        activatedAt: Number,
        // The name of the boost. Used for when users see what boosts they have
        name: { type: String, required: true },
        // The multiplier amount.
        multiplier: { type: Number, default: 0 },
        // The timestamp to show how long a boost should last.
        timestamp: { type: Number }
      }
    ],
    // The current XP
    xp: { type: Number, default: 0 },
    // The current Level
    level: { type: Number, default: 0 },
    // The currency the user has. Used to buy backgrounds/badges
    currency: { type: Number, default: 0 }
  },
  networkGuildID: String,
  network: {
    // The guild id where this users social network exists
    guildID: String
  }
})

export interface UserSettings extends mongoose.Document {
  id: string
  userID: string
  guildIDs: string[]
  backgroundID: number
  theme: string
  afkEnabled: boolean
  afkMessage: string
  isVIP: boolean
  vipGuildsRegistered: string[]
  boosts: Boost[]
  xp: number
  currency: number
  networkGuildID?: string
}

export interface Boost {
  name: string
  timestamp?: number
  multiplier: number
  active: boolean
  activatedAt?: number
}
