import { Document } from 'mongoose'

export interface GamerEmoji extends Document {
  authorID: string
  emojiID: string
  fullCode: string
  guildID: string
  id: string
  name: string
}
