import mongoose from 'mongoose'

export default new mongoose.Schema({
  title: { type: String, lowercase: true, required: true, index: true },
  lastAlertData: { type: String },
  subs: [
    {
      channelID: { type: String, required: true },
      guildID: { type: String, required: true }
    }
  ]
})

export interface GamerManga extends mongoose.Document {
  /** The text that was sent in the last alert */
  lastAlertData?: string
  subs: {
    /** The guild id where this alert is subscribed to. Useful for getting the guild language */
    guildID: string
    /** The channel id where this alert is subscribed to */
    channelID: string
  }[]
  /** The name of the manga in lowercase */
  title: string
}
