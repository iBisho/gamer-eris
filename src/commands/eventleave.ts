import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'
import { GamerEvent } from '../lib/types/gamer'

export default new Command([`eventleave`, `el`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const [number] = args
  const eventID = parseInt(number, 10)
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  if (!eventID) return helpCommand.execute(message, [`eventleave`], context)

  // Get the event from this server using the id provided
  const event = (await Gamer.database.models.event.findOne({
    id: eventID,
    guildID: message.channel.guild.id
  })) as GamerEvent | null
  if (!event) return message.channel.createMessage(language(`events/events:INVALID_EVENT`))

  if (!event.attendees.includes(message.author.id) && !event.waitingList.includes(message.author.id))
    return message.channel.createMessage(language(`events/eventleave:NOT_JOINED`))

  Gamer.helpers.events.leaveEvent(event, message.author.id)

  return message.channel.createMessage(language(`events/eventleave:LEFT`))
})
