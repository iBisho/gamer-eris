import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default new Command([`events`, `event`, `e`], async (message, _args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const language = Gamer.getLanguage(message.channel.guild.id)

  const events = await Gamer.database.models.event.find({ guildID: message.channel.guild.id })
  if (!events.length) return message.channel.createMessage(language('events/events:NONE'))

  const embed = new GamerEmbed()
    .setAuthor(message.author.username, message.author.avatarURL)
    .setDescription(Gamer.helpers.events.listEvents(events))

  return message.channel.createMessage({ embed: embed.code })
})
