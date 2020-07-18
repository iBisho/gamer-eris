import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`eventdeny`, `edeny`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const [number] = args
  const eventID = number ? parseInt(number, 10) : undefined
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  if (!eventID) return helpCommand.execute(message, [`eventdeny`], { ...context, commandName: 'help' })
  // Get the event from this server using the id provided
  const event = await Gamer.database.models.event.findOne({
    eventID,
    guildID: message.guildID
  })
  if (!event) return message.channel.createMessage(language(`events/events:INVALID_EVENT`))

  if (event.denials.includes(message.author.id))
    return message.channel.createMessage(language(`events/eventeventdeny:ALREADY_DENIED`))

  Gamer.helpers.events.denyEvent(event, message.author.id)

  return message.channel.createMessage(language(`events/eventdeny:DENIED`))
})
