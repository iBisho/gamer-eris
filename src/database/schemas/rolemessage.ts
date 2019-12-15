import mongoose from 'mongoose'

export default new mongoose.Schema({
  // The channel id where the role message will be sent
  channelID: { type: String, required: true },
  // The message that is sent. Can be a stringified JSON to send embeds.
  message: { type: String, required: true },
  // Whether this message is for when a role is ADDED to the member
  roleAdded: { type: Boolean, default: false },
  // The role id for this role message
  roleID: { type: String, required: true }
})
export interface GamerRoleMessage extends mongoose.Document {
  channelID: string
  message: string
  roleAdded: boolean
  roleID: string
}
