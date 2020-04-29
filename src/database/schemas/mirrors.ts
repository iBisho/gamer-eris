import mongoose from 'mongoose'

export default new mongoose.Schema({
  name: { type: String, lowercase: true, required: true },
  sourceChannelID: { type: String, required: true },
  mirrorChannelID: { type: String, required: true },
  sourceGuildID: { type: String, required: true },
  mirrorGuildID: { type: String, required: true },
  webhookToken: { type: String, required: true },
  webhookID: { type: String, required: true },
  deleteSourceMessages: Boolean,
  anonymous: Boolean
})

export interface GamerMirror extends mongoose.Document {
  name: string
  sourceChannelID: string
  mirrorChannelID: string
  sourceGuildID: string
  mirrorGuildID: string
  webhookToken: string
  webhookID: string
  deleteSourceMessages?: boolean
  anonymous?: boolean
}
