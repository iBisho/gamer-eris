import mongoose from 'mongoose'

export default new mongoose.Schema({
  weeklyVoteTimestamp: Number
})

export interface ClientSettings extends mongoose.Document {
  weeklyVoteTimestamp?: number
}