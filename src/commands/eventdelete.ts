import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`eventdelete`, `ed`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings?.staff.modRoleIDs) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  const language = Gamer.getLanguage(message.guildID)

  const [number] = args
  const eventID = parseInt(number, 10)

  if (!eventID) return helpCommand.process(message, [`eventdelete`], context)

  // Get the event from this server using the id provided
  const event = await Gamer.database.models.event.findOne({
    id: eventID,
    guildID: message.guildID
  })
  if (!event) return message.channel.createMessage(language(`events/events:INVALID_EVENT`))

  // Delete the event ad as well
  const eventMessage =
    event.adChannelID && event.adMessageID
      ? await Gamer.getMessage(event.adChannelID, event.adMessageID).catch(() => undefined)
      : undefined
  if (eventMessage) eventMessage.delete().catch(() => undefined)

  // Delete the event itself from the database
  Gamer.database.models.event.deleteOne({ _id: event._id }).exec()
  // Let the user know it was deleted
  return message.channel.createMessage(language(`events/eventdelete:DELETE`, { id: event.id }))
})
