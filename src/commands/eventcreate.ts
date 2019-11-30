import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GamerEvent } from '../lib/types/gamer'

export default new Command([`eventcreate`, `ec`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings ? guildSettings.staff.modRoleIDs : []) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const [templateName] = args
  // create new event based on input
  const eventID = await Gamer.helpers.events.createNewEvent(message, templateName, guildSettings)
  if (!eventID) return message.channel.createMessage(language(`events/eventcreate:CREATE_FAILED`))
  // Let the user know it succeeded
  message.channel.createMessage(language(`events/eventcreate:CREATE_SUCCESS`, { number: eventID }))
  // Run the show command for this event so they can see the event details
  const eventshowCommand = Gamer.commandForName(`eventshow`)
  if (!eventshowCommand) return
  eventshowCommand.execute(message, [eventID.toString()], context)

  const event = (await Gamer.database.models.event.findOne({
    id: eventID,
    guildID: message.channel.guild.id
  })) as GamerEvent | null
  if (!event) return
  return Gamer.helpers.events.advertiseEvent(event)
})
