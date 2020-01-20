import mongoose from 'mongoose'

export default new mongoose.Schema({
  name: { type: String, lowercase: true, required: true },
  guildID: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  exceptionChannelIDs: [String],
  exceptionRoleIDs: [String]
}).index({ guildID: 1, name: 1 })

export interface GamerCommandPermission extends mongoose.Document {
  /** The name of the command. It can also be `allcommands` if it refers to all commands. */
  name: string
  /** The id of the guild where this permission is setup. */
  guildID: string
  /** Whether or not this command is enabled in the server. */
  enabled: boolean
  /** Channels where the opposite of enabled will be used. */
  exceptionChannelIDs: []
  /** Roles for whom the opposite of enabled option will be used. */
  exceptionRoleIDs: []
}
