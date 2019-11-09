import mongoose from 'mongoose'

export default new mongoose.Schema({
  // The action that was taken for this modlog
  action: String,
  // The guild id where the modlog was created
  guildID: String,
  // The message id that created this modlog
  messageID: String,
  // The user id for the moderator who took this action
  modID: String,
  // The unique modlog id for the server
  modlogID: Number,
  // The reason that the mod gave for this action
  reason: String,
  // The timestamp that this modlog was created
  timestamp: Number,
  // The user id  of the user who was the target of this action
  userID: String
})
