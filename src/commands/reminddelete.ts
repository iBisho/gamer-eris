import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`reminddelete`, `rd`, `reminderdelete`, `remindmedelete`], (message, args, context) => {
  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const [id] = args

  Gamer.database.models.reminder.deleteOne({ userID: message.author.id, id }).exec()

  return message.channel.createMessage(language('events/reminddelete:DELETED', { mention: message.author.mention }))
})
