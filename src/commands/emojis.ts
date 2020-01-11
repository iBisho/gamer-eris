import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`emojis`, `em`], async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const language = Gamer.getLanguage(message.channel.guild.id)

  const emojis = await Gamer.database.models.emoji.find({ authorID: message.author.id })
  if (!emojis.length) return message.channel.createMessage(language(`emojis/emojis:NONE`))
  let response = ``
  for (const emoji of emojis) {
    if (response.length === 2000) break
    const text = `${emoji.fullCode} **${emoji.name}**\n`
    if (response.length + text.length >= 2000) break
    response += text
  }

  return Gamer.helpers.discord.embedResponse(message, response)
})
