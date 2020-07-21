import mongoose from 'mongoose'

export default new mongoose.Schema({
  // The unique name for this roleset. Used for users to edit/delete etc
  memberID: { type: String, required: true, index: true },
  // The role ids that are in this set.
  words: { type: [String], required: true }
})

export interface GamerSpy extends mongoose.Document {
  memberID: string
  words: string[]
}
