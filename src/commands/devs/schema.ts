import { Command } from 'yuuko'
import Gamer from '../..'

export default new Command('schema', async message => {
  const mails = await Gamer.database.models.mail.find()
  mails.forEach(mail => {
    mail.channelID = mail.id
    mail.save()
  })

  return message.channel.createMessage('done updating schema')
})
