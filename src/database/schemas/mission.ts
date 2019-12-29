import mongoose from 'mongoose'

export default new mongoose.Schema({
  userID: { type: String, required: true, index: true },
  guildID: { type: String, required: true },
  commandName: { type: String, required: true },
  amount: { type: Number, default: 0 },
  completed: Boolean
}).index({ userID: 1, commandName: 1 })
