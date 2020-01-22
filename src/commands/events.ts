import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default new Command([`events`, `event`, `e`], async (message, _args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const events = await Gamer.database.models.event.find({ guildID: message.guildID })
  if (!events.length) return message.channel.createMessage(language('events/events:NONE'))

  const embed = new GamerEmbed().setAuthor(message.author.username, message.author.avatarURL)

  while (events.length) {
    embed.setDescription(Gamer.helpers.events.listEvents(events.splice(0, 12)))
    message.channel.createMessage({ embed: embed.code })
  }

  return
})
