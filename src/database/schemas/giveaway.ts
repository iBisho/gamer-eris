import mongoose from 'mongoose'

export default new mongoose.Schema({
  giveawayID: { type: Number, required: true, index: true },
  guildID: { type: String, required: true, index: true },
  creatorID: { type: String, required: true },
  messageID: { type: String, required: true },
  channelID: { type: String, required: true },
	costToJoin: { type: Number, required: true, default: 0 },
	requiredRoleIDsToJoin: { type: [String], required: true },
  participants: [{ userID: { type: String, required: true }, timestamp: { type: Number, required: true } }],
  pickedParticipants: [{ userID: { type: String, required: true }, timestamp: { type: Number, required: true } }],
  createdAt: { type: Number, required: true },
  duration: { type: Number, required: true },
  amountOfWinners: { type: Number, required: true, default: 1 },
  allowDuplicates: { type: Boolean, required: true, default: false },
  duplicateCooldown: { type: Number, required: true, default: 0 },
  emoji: { type: String, required: true },
  pickWinners: { type: Boolean, required: true, default: true },
  pickInterval: { type: Number, required: true, default: 0 },
	notificationsChannelID: { type: String, required: true },
  delayTillStart: { type: Number, required: true, default: 0 },
  allowCommandEntry: { type: Boolean, required: true, default: true },
	allowReactionEntry: { type: Boolean, required: true, default: true },
	hasStarted: { type: Boolean, required: true, default: false },
	hasEnded: { type: Boolean, required: true, default: false },
	simple: { type: Boolean, required: true, default: true },
	setRoleIDs: { type: [String], required: true },
}).index({ giveawayID: 1, guildID: 1 })

export interface GamerGiveaway extends mongoose.Document {
  /** The unique id for this giveaway. Useful for commands like delete or edit the giveaway */
  giveawayID: number
  /** Guild id where this giveaway was created */
  guildID: string
  /** The user who created this giveaway. */
  creatorID: string
  /** The message id attached to this giveaway. Will be "" if the only way to enter is command based. */
	messageID: string
	/** The channel id where this giveaway will occur. */
	channelID: string
	/** The amount of gamer coins needed to enter. */
	costToJoin: number
	/** The role ids that are required to join. User must have atleast 1. */
	requiredRoleIDsToJoin: string[]
	/** The user ids who have entered and the time at which they joined. */
  participants: { userID: string; timestamp: number }[]
	/** The user ids that have been picked already. So we don't pick duplicates. */
	pickedParticipants: { userID: string; timestamp: number }[]
	/** The time when the giveaway was created. */
	createdAt: number
	/** How long is this giveaway going to last for. */
	duration: number
	/** The amount of winners for this giveaway */
	amountOfWinners: number
	/** Whether users are allowed to enter the giveaway multiple times. */
	allowDuplicates: boolean
	/** How long does a user need to wait to enter the giveaway again. For example, one time per day. */
	duplicateCooldown: number
	/** The emoji <:name:id> of the emoji used in this giveaway, if reaction based otherwise "" */
	emoji: string
	/** Whether users picked will be the winners or the losers. */
	pickWinners: boolean
	/** The amount of time to wait before picking the next user. */
	pickInterval: number
	/** The channel id where messages will be sent when reaction based like X has joined the giveaway. */
	notificationsChannelID: string
	/** The amount of milliseconds to wait before starting this giveaway. */
	delayTillStart: number
	/** Whether the giveaway has already started. */
	hasStarted: boolean
	/** Whether the giveaway has already ended. */
	hasEnded: boolean
	/** Whether the giveaway allows entry using commands. */
	allowCommandEntry: boolean
	/** Whether the giveaway allows entry using reaction entries. */
	allowReactionEntry: boolean
	/** Whether this used the simple giveaway */
	simple: boolean
	/** The role ids for which roles are allowed to be used to enter the giveaway */
	setRoleIDs: string[]
}
