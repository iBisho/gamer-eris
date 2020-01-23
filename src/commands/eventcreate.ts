import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`eventcreate`, `ec`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  const language = Gamer.getLanguage(message.guildID)

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings?.staff.modRoleIDs) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID) &&
    (!guildSettings?.roleIDs.eventsCreate || !message.member.roles.includes(guildSettings.roleIDs.eventsCreate))
  )
    return

  const [templateName] = args
  // create new event based on input
  const eventID = await Gamer.helpers.events.createNewEvent(message, templateName, guildSettings)
  if (!eventID) return message.channel.createMessage(language(`events/eventcreate:CREATE_FAILED`))
  // Let the user know it succeeded
  message.channel.createMessage(language(`events/eventcreate:CREATE_SUCCESS`, { number: eventID }))
  // Run the show command for this event so they can see the event details
  const eventshowCommand = Gamer.commandForName(`eventshow`)
  if (!eventshowCommand) return
  eventshowCommand.process(message, [eventID.toString()], context)

  const event = await Gamer.database.models.event.findOne({
    id: eventID,
    guildID: message.guildID
  })
  if (!event) return
  return Gamer.helpers.events.advertiseEvent(event)
})
