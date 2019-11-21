import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GamerEmoji } from '../lib/types/database'

export default new Command([`emojidelete`, `emd`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const [name] = args
  if (!name) return message.channel.createMessage(language(`community/emojidelete:NEED_NAME`))

  // Find the emoji with a name AND author id so user cant delete others emojis
  const nameExists = (await Gamer.database.models.emoji.findOne({
    name,
    authorID: message.author.id
  })) as GamerEmoji | null
  if (!nameExists) return message.channel.createMessage(language(`community/emojidelete:DOESNT_EXIST`, { name }))

  await Gamer.database.models.emoji.deleteOne({ name, authorID: message.author.id })

  return message.channel.createMessage(language(`community/emojidelete:DELETED`, { name }))
})
