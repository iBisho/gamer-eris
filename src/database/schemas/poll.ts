import mongoose from 'mongoose'

export default new mongoose.Schema({
  userID: { type: String, required: true },
  guildID: { type: String, required: true },
  messageID: { type: String, required: true },
  question: { type: String, required: true },
  options: { type: [String], required: true },
  endsAt: { type: Number, required: true },
  maxVotes: { type: Number, required: true },
  allowedRoleIDs: { type: [String], required: true },
  resultsChannelID: { type: String, required: true },
  anonymousVotes: [
    {
      userID: String,
      options: [Number]
    }
  ],
  pollID: { type: Number, required: true },
  channelID: { type: String, required: true }
})

export interface GamerPoll extends mongoose.Document {
  /** The creator of the poll */
  userID: string
  /** The guild where the poll was created */
  guildID: string
  /** The message id of the poll question embed */
  messageID: string
  /** The question for the poll */
  question: string
  options: string[]
  endsAt: number
  maxVotes: number
  allowedRoleIDs: string[]
  resultsChannelID: string
  anonymousVotes: {
    userID: string
    options: number[]
  }[]
  pollID: number
  channelID: string
}
