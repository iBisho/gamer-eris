import mongoose from 'mongoose'

export default new mongoose.Schema({
  // The unique name for this reaction role
  name: String,
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
  messageID: String,
  // The guild id where this reaction role was created
  guildID: String,
  // The user id of the user who created this reaction role
  authorID: String
})
