import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'
import { GamerEvent } from '../lib/types/gamer'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default new Command([`events`, `event`, `e`], async (message, _args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const events = (await Gamer.database.models.event.find({ guildID: message.channel.guild.id })) as GamerEvent[]
  if (!events.length) return

  const embed = new GamerEmbed()
    .setAuthor(message.author.username, message.author.avatarURL)
    .setDescription(Gamer.helpers.events.listEvents(events))

  message.channel.createMessage({ embed: embed.code })
})
