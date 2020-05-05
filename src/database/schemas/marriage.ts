import mongoose from 'mongoose'

export default new mongoose.Schema({
  authorID: { type: String, required: true, index: true },
  spouseID: { type: String, required: true },
  step: { type: Number, required: true },
  accepted: Boolean,
  weddingShopCounter: { type: Number, default: 0 },
  lifeCounter: { type: Number, default: 0 },
  love: { type: Number, default: 20 }
})

export interface GamerMarriage extends mongoose.Document {
  /** The author id of the user who initiated the proposal. */
  authorID: string
  /** The author id of the user who received the proposal */
  spouseID: string
  /** The point that this marriage has currently reached. Used to determine what to do next in their marriage. */
  step: number
  /** Whether or not the spouse accepted the proposal. */
  accepted: boolean
  /** How many items in the shopping list for the wedding ceremoney has been completed. */
  weddingShopCounter: number
  /** How many of the daily life tasks have been completed. */
  lifeCounter: number
  /** The counter for the amount of love in a marriage. If it drops below 10 it will randomly end the marriage. */
  love: number
}
