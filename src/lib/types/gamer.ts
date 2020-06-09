import { Message } from 'eris'
import { MessageEmbed } from 'helperis'
import { GuildSettings } from './settings'
import { TFunction } from 'i18next'
import { Document } from 'mongoose'

export interface Collector {
  authorID: string
  createdAt: number
  channelID: string
  guildID: string
  data: unknown
  callback(message: Message, collector: Collector): Promise<unknown>
}

export interface FeedbackCollectorData {
  language: TFunction
  settings: GuildSettings
  embed: MessageEmbed
  question: string
}

export interface SetupCollectorData {
  step: number
}

export interface PollcreateCollectorData {
  step: number
  question: string
  options: string[]
  duration: number
  maxVotes: number
  allowedRoleIDs: string[]
  resultsChannelID: string
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

export interface GamerModlog extends Document {
  action: `ban` | `unban` | `mute` | `unmute` | `warn` | `kick` | `note`
  duration?: number
  guildID: string
  messageID?: string
  modID: string
  modlogID: number
  needsUnmute: boolean
  reason: string
  timestamp: number
  userID: string
}

export interface GamerReactionRole extends Document {
  name: string
  reactions: {
    reaction: string
    roleIDs: string[]
  }[]
  messageID: string
  channelID: string
  guildID: string
  authorID: string
}

export interface GamerTradingCard extends Document {
  game: string
  guildID: string
  channelID: string
  lastItemName?: string
}

export interface GamerTag extends Document {
  name: string
  type: string
  guildID: string
  embedCode: string
  mailOnly: boolean
  isPublic: boolean
}

export interface GamerMail extends Document {
  channelID: string
  userID: string
  guildID: string
  topic: string
}

export interface GamerMailLabel extends Document {
  authorID: string
  categoryID: string
  guildID: string
  name: string
}

export interface GamerRoleset extends Document {
  guildID: string
  roleIDs: string[]
  name: string
}
