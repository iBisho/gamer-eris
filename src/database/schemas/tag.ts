import mongoose from 'mongoose'

export default new mongoose.Schema({
  // The content that will be sent. Usually a JSON string to send embed
  embedCode: String,
  // The guild id where this tag was created
  guildID: String,
  // Whether this tag is allowed outside of mails
  mailOnly: Boolean,
  // The name for the tag
  name: String,
  // The type of tag. Basic, advanced, random
  type: String
})
