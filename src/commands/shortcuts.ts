import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`shortcuts`, async (message, _args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const shortcuts = await Gamer.database.models.shortcut.find({ guildID: message.guildID })
  if (!shortcuts.length) return message.channel.createMessage(language(`shortcuts/shortcuts:NONE`))

  let response = ``

  for (const shortcut of shortcuts) {
    if (response.length === 2000) break
    const text = `**${shortcut.name}**\n`
    if (response.length + text.length >= 2000) break
    response += text
  }

  return message.channel.createMessage(response)
})
