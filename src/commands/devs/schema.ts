import { Command } from 'yuuko'
import Gamer from '../..'

export default new Command('schema', async message => {
  const events = await Gamer.database.models.event.find()
  for (const event of events) {
    if (typeof event.id === 'number') event.eventID = event.id
    event.save()
  }
  message.channel.createMessage('events are updated')

  const mails = await Gamer.database.models.mail.find()
  for (const mail of mails) {
    mail.channelID = mail.id
  }
  message.channel.createMessage('mails are updated')

  const feedbacks = await Gamer.database.models.feedback.find()
  for (const fb of feedbacks) {
    fb.feedbackID = fb.id
  }
  message.channel.createMessage('reminders are updated')

  const reminders = await Gamer.database.models.reminder.find()
  for (const rem of reminders) {
    rem.reminderID = rem.id
  }

  return message.channel.createMessage('done updating schema')
})
