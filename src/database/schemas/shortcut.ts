import mongoose from 'mongoose'

export default new mongoose.Schema({
  actions: [
    {
      // The command to run
      command: String,
      // The args to pass to that command
      args: [String]
    }
  ],
  // Whether or not to delete the trigger message that activate this shortcut
  deleteTrigger: Boolean,
  // The guild id where this shortcut was created
  guildID: String,
  // The name of the shortcut
  name: String
})

export interface GamerShortcut extends mongoose.Document {
  actions: ShortcutAction[]
  deleteTrigger: boolean
  guildID: string
  name: string
}

export interface ShortcutAction {
  command: string
  args: string[]
}
