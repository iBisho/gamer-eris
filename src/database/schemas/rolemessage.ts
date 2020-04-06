import mongoose from 'mongoose'

export default new mongoose.Schema({
  channelID: { type: String, required: true },
  message: { type: String, required: true },
  roleAdded: { type: Boolean, default: false },
  roleID: { type: String, required: true },
  guildID: { type: String, required: true }
})

export interface GamerRoleMessage extends mongoose.Document {
  /** The channel id where the role message will be sent */
  channelID: string
  /** The message that is sent. Can be a stringified JSON to send embeds. */
  message: string
  /** Whether this message is for when a role is ADDED to the member */
  roleAdded: boolean
  /** The role id for this role message */
  roleID: string
  /** The guild id for where this role message was created. */
  guildID: string
}
