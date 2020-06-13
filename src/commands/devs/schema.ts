import { Command } from 'yuuko'
import Gamer from '../..'

export default new Command('schema', async message => {
  const feedbacks = await Gamer.database.models.feedback.find()
  feedbacks.forEach(feedback => {
    if (feedback.guildID && !Gamer.guilds.has(feedback.guildID)) {
      Gamer.database.models.feedback.deleteOne({ _id: feedback._id }).exec()
      return
    }
    // feedback.feedbackID = feedback.id
    // feedback.save()
  })

  return message.channel.createMessage('done updating schema')
})
