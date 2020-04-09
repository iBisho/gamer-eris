import mongoose from 'mongoose'

export default new mongoose.Schema({
  guildID: { type: String, required: true },
  userID: { type: String, required: true },
  messageID: { type: String, required: true },
  channelID: { type: String, required: true },
  timestamp: { type: Number, required: true },
  type: { type: String, required: true }
})

export interface GamerAnalytic extends mongoose.Document {
  guildID: string
  userID: string
  messageID: string
  channelID: string
  timestamp: number
  type: 'MESSAGE_CREATE' | 'MEMBER_ADDED' | 'MEMBER_REMOVED'
}
