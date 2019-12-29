import mongoose from 'mongoose'

export default new mongoose.Schema({
  // The unique name for this reaction role
  name: { type: String, required: true },
  // The reactions and the roles per that reaction
  reactions: [
    {
      // The id of the emoji
      reaction: String,
      // The roles to give or remove for this emoji
      roleIDs: [String]
    }
  ],
  // The message id that this reaction role is tied to
  messageID: { type: String, required: true, index: true },
  // The channel id where the reaction role is tied to
  channelID: { type: String, required: true },
  // The guild id where this reaction role was created
  guildID: { type: String, required: true },
  // The user id of the user who created this reaction role
  authorID: { type: String, required: true }
}).index({ name: 1, guildID: 1 })
