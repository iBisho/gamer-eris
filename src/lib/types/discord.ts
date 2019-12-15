import { TextableChannel } from 'eris'

export interface ReactionEmoji {
  id: string
  name: string
}

export interface PartialMessage {
  id: string
  channel: TextableChannel
}
