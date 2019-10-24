import * as mongoose from 'mongoose'

export default new mongoose.Schema({
  // The user id for who created the label
  authorID: String,
  // The category id that this label is assigned to. Mails with this label will be moved to this category
  categoryID: String,
  // The guild id where this label is created
  guildID: String,
  // The name of the label
  name: String
})
