export default {
  id: '',
  nickname: undefined,
  guildID: '',
  memberID: '',
  leveling: {
    // The current XP
    xp: 0,
    // The current Level
    level: 0,
    // The current Voice XP
    voicexp: 0,
    // The current Voice Level
    voicelevel: 0,
    // Timestamp when the member joined the voice channel
    joinedVoiceAt: 0,
    // Used to determine when the last time the user was active in the server. (Used for Inactive XP Removal)
    lastUpdatedAt: 0
  }
}
