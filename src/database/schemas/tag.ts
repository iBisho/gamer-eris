import mongoose from 'mongoose'

export default new mongoose.Schema({
  // The name for the tag
  name: String,
  // The content that will be sent. Usually a JSON string to send embed
  content: String,
  // The type of tag. Basic, advanced, random
  type: String,
  // The guild id where this tag was created
  guildID: String
})
