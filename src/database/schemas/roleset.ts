import mongoose from 'mongoose'

export default new mongoose.Schema({
  // The unique name for this roleset. Used for users to edit/delete etc
  name: { type: String, required: true, lowercase: true },
  // The role ids that are in this set.
  roleIDs: { type: [String], required: true },
  // The guild where this was created
  guildID: { type: String, required: true }
})
