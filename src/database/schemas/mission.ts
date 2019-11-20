import mongoose from 'mongoose'

export default new mongoose.Schema({
  userID: { type: String, required: true },
  guildID: { type: String, required: true },
  commandName: { type: String, required: true },
  amount: { type: Number, default: 0 },
  completed: Boolean
})
