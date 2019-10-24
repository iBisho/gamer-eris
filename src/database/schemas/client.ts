import * as mongoose from 'mongoose'

export default new mongoose.Schema({
  statistics: {
    // The amount of moderation actions gamer has taken
    totalModlogs: Number,
    // The amount of events that have been created
    totalEvents: Number,
    // The total mails sent
    totalMails: Number,
    // The total feedbacks sent
    totalFeedbacks: Number,
    // The total profile invites sent.
    totalProfileInvites: Number,
    // The total messages processed
    totalMessagesProcessed: Number
  },
  vip: {
    userIDs: [String],
    guildIDs: [String]
  },
  antiraid: {
    nudebotUserIDs: [String]
  }
})
