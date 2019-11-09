import mongoose from 'mongoose'

export default new mongoose.Schema({
  // The level number when the user will be given these roles
  level: Number,
  // The roles to be given/taken when the user gains/loses this level
  roleIDs: [String],
  // The guild id where this levelrole was created
  guildID: String,
  // The user id for the user who created it
  authorID: String
})
