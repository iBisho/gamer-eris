import mongoose from 'mongoose'

export default new mongoose.Schema({
  userID: { type: String, required: true, index: true },
  amount: { type: Number, default: 0 },
  timestamp: { type: Number, required: true }
})

export interface GamerUpvote extends mongoose.Document {
  userID: string
  amount: number
  timestamp: number
}
