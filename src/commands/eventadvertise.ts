import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`eventadvertise`, `ead`], async (message, args, context) => {
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

  if (!eventID) return helpCommand.process(message, [`eventadvertise`], context)
  // Get the event from this server using the id provided
  const event = await Gamer.database.models.event.findOne({
    id: eventID,
    guildID: message.guildID
  })
  if (!event) return message.channel.createMessage(language(`events/events:INVALID_EVENT`))

  // If an old event card exists in a different channel get rid of it
  if (event.adChannelID && event.adMessageID && event.adChannelID !== message.channel.id) {
    Gamer.deleteMessage(event.adChannelID, event.adMessageID, `Event card moved to different channel.`).catch(
      () => undefined
    )
  }

  const channelID = message.channelMentions?.length ? message.channelMentions[0] : message.channel.id
  return Gamer.helpers.events.advertiseEvent(event, channelID)
})
