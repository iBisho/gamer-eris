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

export interface GamerEvent extends Document {
  id: number
  authorID: string
  backgroundURL?: string
  guildID: string
  start: number
  end: number
  duration: number
  attendees: string[]
  denials: string[]
  waitingList: string[]
  reminders: number[]
  executedReminders: number[]
  title: string
  tags: string[]
  description: string
  maxAttendees: number
  hasStarted: boolean
  isRecurring: boolean
  frequency: number
  adMessageID?: string
  adChannelID?: string
  createdAt: number
  platform: string
  game: string
  activity: string
  removeRecurringAttendees: boolean
  allowedRoleIDs: string[]
  alertRoleIDs: string[]
  dmReminders: boolean
  templateName?: string
  minutesFromNow: number
  showAttendees?: boolean
}

export interface GamerModlog extends Document {
  action: `ban` | `unban` | `mute` | `unmute` | `warn` | `kick`
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
  id: string
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
