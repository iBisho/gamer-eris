import mongoose from 'mongoose'

export default new mongoose.Schema({
  userID: { type: String, required: true, index: true },
  guildIDs: { type: [String], default: [], index: true },
  backgroundID: { type: Number, default: 1 },
  theme: { type: String, default: `white` },
  afkEnabled: Boolean,
  afkMessage: {
    type: String,
    default: `Hi 👋, I am AFK at the moment. I will get back to you as soon as possible. 😄`
  },
  isVIP: Boolean,
  vipGuildsRegistered: [String],
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
  networkGuildID: String
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
