import mongoose from 'mongoose'

export default new mongoose.Schema({
  channelID: { type: String, required: true },
  content: { type: String, required: true },
  guildID: { type: String, required: true },
  id: { type: String, required: true },
  interval: Number,
  recurring: Boolean,
  timestamp: { type: Number, required: true, index: true },
  userID: { type: String, required: true }
})

export interface GamerReminder extends mongoose.Document {
  /** The channel the reminder was created in and will be sent */
  channelID: string
  /** The text the reminder will send. */
  content: string
  /** The guild id where this was created. useful for getting the guild language */
  guildID: string
  /** The unique id(message id) of the reminder. Useful for users deleting reminders. */
  id: string
  /** If the reminder is recurring the time interval between reminders */
  interval?: number
  /** Whether or not this reminder is recurring */
  recurring: boolean
  /** The timestampt when this reminder will occur next. */
  timestamp: number
  /** The user id of the person who created this reminder. */
  userID: string
}
