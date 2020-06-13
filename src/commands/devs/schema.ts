import { Command } from 'yuuko'
import Gamer from '../..'

export default new Command('schema', async message => {
  const mails = await Gamer.database.models.mail.find()
  mails.forEach(async mail => {
    if (!Gamer.guilds.has(mail.guildID) && mail.guildID)
      return Gamer.database.models.mail.deleteOne({ _id: mail._id }).exec()
    if (mail.channelID && !Gamer.getChannel(mail.channelID))
      return Gamer.database.models.mail.deleteMany({ _id: mail._id }).exec()

    if (!mail.id) return Gamer.database.models.mail.deleteOne({ _id: mail._id }).exec()

    mail.channelID = mail.id
    await mail.save()
    return
  })
  // const feedbacks = await Gamer.database.models.feedback.find()
  // feedbacks.forEach(feedback => {
  //   if (feedback.guildID && !Gamer.guilds.has(feedback.guildID)) {
  //     Gamer.database.models.feedback.deleteOne({ _id: feedback._id }).exec()
  //     return
  //   }
  //   // feedback.feedbackID = feedback.id
  //   // feedback.save()
  // })

  return message.channel.createMessage('done updating schema')
})
