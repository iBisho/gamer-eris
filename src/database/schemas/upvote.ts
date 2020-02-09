import mongoose from 'mongoose'

export default new mongoose.Schema({
  amount: { type: Number, default: 0 },
  luckySlots: { type: Number, required: true },
  timestamp: { type: Number, required: true },
  userID: { type: String, required: true, index: true },
  weeklyCount: { type: Number, required: true }
})

export interface GamerUpvote extends mongoose.Document {
  amount: number
  luckySlots: number
  timestamp: number
  userID: string
  weeklyCount: number
}
