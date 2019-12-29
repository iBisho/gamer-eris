import mongoose from 'mongoose'

export default new mongoose.Schema({
  // The ID number of the event that users will use to run commands with
  id: { type: Number, required: true, index: true },
  // A custom spot for the user to write the activity of the event
  activity: String,
  // The channel id where the advertisement will be.
  adChannelID: String,
  // The message id of the advertisement
  adMessageID: String,
  // The role ids that are required to join the event
  allowedRoleIDs: [String],
  // The role ids that will be @mentioned when the event starts and for reminders.
  alertRoleIDs: [String],
  // The user ids who have marked YES they are attending
  attendees: [String],
  // The user id of the creator of the event
  authorID: String,
  // The background image url. VIP Guilds can customize this.
  backgroundURL: String,
  // The timestamp when the event was created
  createdAt: Number,
  // The user ids who will NOT be attending
  denials: [String],
  // A custom spot for the user to write the description of the event.
  description: String,
  // Whether reminders should be sent in DM to all attendees.
  dmReminders: Boolean,
  // The milliseconds for how long the event will last
  duration: Number,
  // The timestamp for when the event will end
  end: Number,
  // The reminders that have been sent already
  executedReminders: [Number],
  // How often this event should repeat
  frequency: Number,
  // A custom spot for the user to write the name of the game for the event.
  game: String,
  // The guild id where the event is created
  guildID: String,
  // Whether or not the event has started.
  hasStarted: Boolean,
  // Whether or not the event should repeat after its over.
  isRecurring: Boolean,
  // The maximum amount of users allowed to join
  maxAttendees: Number,
  // Unique number for this event
  number: Number,
  // A custom spot for the user to write the platforms for the event.
  platform: String,
  // The reminders that need to be sent
  reminders: [Number],
  // Whether all attendess need to be reset when the event is repeated.
  removeRecurringAttendees: Boolean,
  // The timestamp for when the event will start.
  start: Number,
  // Whether to show the first few attendees on the card
  showAttendees: Boolean,
  // A custom spot for the user to create 5 custom #tags
  tags: [String],
  // A custom spot for the user to set the title of the event
  title: String,
  // The timezone for the event
  timezone: String,
  // The user ids of those who want to attend but applied when the event was already full
  waitingList: [String],
  // If the event is made into a template event then it will be given a name
  templateName: String
})
