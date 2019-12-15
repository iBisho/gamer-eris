import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`shortcuts`, async (message, _args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return
  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const shortcuts = await Gamer.database.models.shortcut.find({ guildID: message.channel.guild.id })
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
