import * as mongoose from 'mongoose'

export default new mongoose.Schema({
  nickname: String,
  leveling: {
    // The current XP
    xp: Number,
    // The current Level
    level: Number,
    // The current Voice XP
    voicexp: Number,
    // The current Voice Level
    voicelevel: Number,
    // Timestamp when the member joined the voice channel
    joinedVoiceAt: Number,
    // Used to determine when the last time the user was active in the server. (Used for Inactive XP Removal)
    lastUpdatedAt: Number
  }
})
