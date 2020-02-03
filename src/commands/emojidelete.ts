import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`emojidelete`, `emd`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const [name] = args
  if (!name) return message.channel.createMessage(language(`emojis/emojidelete:NEED_NAME`))

  // Find the emoji with a name AND author id so user cant delete others emojis
  const nameExists = await Gamer.database.models.emoji.findOne({
    name: name.toLowerCase(),
    authorID: message.author.id
  })
  if (!nameExists) return message.channel.createMessage(language(`emojis/emojidelete:DOESNT_EXIST`, { name }))

  Gamer.database.models.emoji.deleteOne({ _id: nameExists._id }).exec()

  return message.channel.createMessage(language(`emojis/emojidelete:DELETED`, { name }))
})
