import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`tags`, `tag`], async (message, _args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const tags = await Gamer.database.models.tag.find({ guildID: message.guildID })
  if (!tags.length) {
    message.channel.createMessage(language(`tags/tags:NONE`))
    const helpCommand = Gamer.commandForName('help')
    return helpCommand?.process(message, ['tagcreate'], context)
  }

  let response = ``
  for (const tag of tags) {
    if (response.length === 2000) break
    const text = `**${tag.name}**\n`
    if (response.length + text.length >= 2000) break
    response += text
  }

  return Gamer.helpers.discord.embedResponse(message, response)
})
