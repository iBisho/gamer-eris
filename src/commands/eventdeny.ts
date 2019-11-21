import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GamerEvent } from '../lib/types/gamer'

export default new Command([`eventdeny`, `edeny`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const [number] = args
  const eventID = parseInt(number, 10)

  // Get the event from this server using the id provided
  const event = (await Gamer.database.models.event.findOne({
    id: eventID,
    guildID: message.channel.guild.id
  })) as GamerEvent | null
  if (!event) return message.channel.createMessage(language(`events/events:INVALID_EVENT`))

  if (event.denials.includes(message.author.id))
    return message.channel.createMessage(language(`events/eventeventdeny:ALREADY_DENIED`))

  Gamer.helpers.events.denyEvent(event, message.author.id)

  return message.channel.createMessage(language(`events/eventdeny:DENIED`))
})
