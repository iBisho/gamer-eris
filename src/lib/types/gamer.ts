import { Message } from 'eris'
import GamerEmbed from '../structures/GamerEmbed'
import { GuildSettings } from './settings'
import * as i18next from 'i18next'
import { Document } from 'mongoose'

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
  data: unknown
  callback(message: Message, collector: Collector): Promise<void>
}

export interface FeedbackCollectorData {
  language: i18next.TFunction
  settings: GuildSettings
  embed: GamerEmbed
  question: string
}

export interface GamerLevel extends Document {
  authorID: string
  guildID: string
  id: string
  level: number
  roleIDs: string[]
}

export interface Mission {
  amount: number
  commandName: string
  title: string
  reward: number
}

export interface GamerMission extends Document {
  amount: number
  commandName: string
  completed: boolean
  guildID: string
  userID: string
}
