import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`eventleave`, `el`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient

  const language = Gamer.getLanguage(message.guildID)

  const [number] = args
  const eventID = parseInt(number, 10)
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  if (!eventID) return helpCommand.execute(message, [`eventleave`], { ...context, commandName: 'help' })

  // Get the event from this server using the id provided
  const event = await Gamer.database.models.event.findOne({
    eventID,
    guildID: message.guildID
  })
  if (!event) return message.channel.createMessage(language(`events/events:INVALID_EVENT`))

  if (!event.attendees.includes(message.author.id) && !event.waitingList.includes(message.author.id))
    return message.channel.createMessage(language(`events/eventleave:NOT_JOINED`))

  Gamer.helpers.events.leaveEvent(event, message.author.id)

  return message.channel.createMessage(language(`events/eventleave:LEFT`))
})
