import * as mongoose from 'mongoose'

export default new mongoose.Schema({
  // The message id also used as the unique identifier
  id: String,
  // THe author id who sent the feedback
  authorID: String,
  // The guid id where the feedback was sent
  guildID: String,
  // The channel id where the feedback was sent
  channelID: String,
  // The unique number identified for the feedback in that server.
  number: Number,
  // Whether this feedback is a bug report
  isBugReport: Boolean
})
