import { Message } from 'eris'

export interface GamerEmbedObject {
  title?: string
  author?: {
    url?: string
    icon_url?: string
    iconURL?: string
    name: string
  }
  description?: string
  timestamp?: boolean
  url?: string
  footer?: {
    text?: string
    iconURL?: string
    icon_url?: string
  }
  thumbnail?: string
  image?: string
  fields?: {
    name: string
    value: string
    inline?: boolean
  }[]
  plaintext?: string
  plainText?: string
  color?: string
}

export interface Collector {
  authorID: string
  createdAt: number
  channelID: string
  guildID: string
  callback(message: Message): Promise<void>
}
