import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`emojidelete`, `emd`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const [name] = args
  if (!name) return message.channel.createMessage(language(`emojis/emojidelete:NEED_NAME`))

  // Find the emoji with a name AND author id so user cant delete others emojis
  const nameExists = await Gamer.database.models.emoji.findOne({
    name: name.toLowerCase(),
    authorID: message.author.id
  })
  if (!nameExists) return message.channel.createMessage(language(`emojis/emojidelete:DOESNT_EXIST`, { name }))

  await Gamer.database.models.emoji.deleteOne({ _id: nameExists._id })

  return message.channel.createMessage(language(`emojis/emojidelete:DELETED`, { name }))
})
