import mongoose from 'mongoose'

export default new mongoose.Schema({
  title: { type: String, lowercase: true, required: true, index: true },
  subs: [
    {
      channelID: { type: String, required: true },
      guildID: { type: String, required: true },
      lastAlertData: { type: String }
    }
  ]
})

export interface GamerManga extends mongoose.Document {
  subs: {
    /** The guild id where this alert is subscribed to. Useful for getting the guild language */
    guildID: string
    /** The channel id where this alert is subscribed to */
    channelID: string
    /** The text that was sent in the last alert */
    lastAlertData?: string
  }[]
  /** The name of the manga in lowercase */
  title: string
}
