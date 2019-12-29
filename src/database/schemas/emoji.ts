import mongoose from 'mongoose'

export default new mongoose.Schema({
  // The user id who created this emoji
  authorID: String,
  // The id of the emoji
  emojiID: String,
  // The full unicode version of the emoji <:name:id>
  fullCode: String,
  // The guild id where the emoji is stored
  guildID: String,
  // The custom name for this emoji
  name: { type: String, required: true, index: true }
})
