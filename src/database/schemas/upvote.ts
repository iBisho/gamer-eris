import mongoose from 'mongoose'

export default new mongoose.Schema({
  userID: { type: String, required: true, index: true },
  amount: { type: Number, default: 0 }
})

export interface GamerUpvote extends mongoose.Document {
  userID: string
  amount: number
}
