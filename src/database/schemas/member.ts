import * as mongoose from 'mongoose'

export default new mongoose.Schema({
  id: { type: String, required: true },
  guildID: { type: String, required: true },
  memberID: { type: String, required: true },
  nickname: String,
  leveling: {
    // The current XP
    xp: { type: Number, default: 0 },
    // The current Level
    level: { type: Number, default: 0 },
    // The current Voice XP
    voicexp: { type: Number, default: 0 },
    // The current Voice Level
    voicelevel: { type: Number, default: 0 },
    // Timestamp when the member joined the voice channel
    joinedVoiceAt: { type: Number, default: 0 },
    // Used to determine when the last time the user was active in the server. (Used for Inactive XP Removal)
    lastUpdatedAt: { type: Number, default: 0 }
  }
})
