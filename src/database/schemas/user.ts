import mongoose from 'mongoose'

export default new mongoose.Schema({
  id: String,
  userID: { type: String, required: true },
  profile: {
    // The id number of the background that the user has equipped
    backgroundID: { type: Number, default: 1 },
    // The theme color of the profile card
    theme: { type: String, default: `white` }
  },
  afk: {
    // Whether the afk message should be sent when someone @ the user
    enabled: Boolean,
    // The message to send when the user is afk and someone @mentions the user. Can be JSON string for embeds
    message: { type: String, default: `Hi 👋, I am AFK at the moment. I will get back to you as soon as possible. 😄` }
  },
  // If you are a mod and ban a user on a server, this can allow you to easily ban that user on all servers u share.
  moderationNetworkEnabled: Boolean,
  vip: {
    // Whether or not the user is a vip user
    isVIP: Boolean,
    // The guilds this user has registered as VIP
    guildsRegistered: [String],
    // The amount of tickets the user has remaining
    openTickets: { type: Number, default: 0 }
  },
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
    currency: { type: Number, default: 0 },
    // The backgrounds the user has bought.
    backgrounds: [Number],
    badges: {
      // The badges the user has bought.
      bought: [Number],
      // The badges the user has equipped
      equipped: [Number]
    },
    // The badge spots the user has bought
    badgesUnlocked: { type: Number, min: 1, max: 4, default: 1 }
  },
  network: {
    // All the users that are following this user
    followerIDs: { type: [String], default: [] },
    // The guild id where this users social network exists
    guildID: String
  }
})
