import * as mongoose from 'mongoose'

export default new mongoose.Schema({
  // The channel id for this mail. Also used as the unique identifier
  id: String,
  // The user id who sent the mail.
  userID: String,
  // The guild id for where the mail was created
  guildID: String,
  // The first 50 characters of the mail.
  topic: String
})
