import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GamerEmoji } from '../lib/types/database'

export default new Command([`emojis`, `em`], async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const emojis = (await Gamer.database.models.emoji.find({ authorID: message.author.id })) as GamerEmoji[]
  if (!emojis.length) return message.channel.createMessage(language(`emojis/emojis:NONE`))
  let response = ``
  for (const emoji of emojis) {
    if (response.length === 2048) break
    const text = `${emoji.fullCode} **${emoji.name}**\n`
    if (response.length + text.length >= 2048) break
    response += text
  }

  return message.channel.createMessage(response)
})
