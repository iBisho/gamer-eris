import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GamerEvent } from '../lib/types/gamer'

export default new Command([`eventadvertise`, `ead`], async (message, args, context) => {
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

  const [number] = args
  const eventID = parseInt(number, 10)
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  if (!eventID) return helpCommand.execute(message, [`eventadvertise`], context)
  // Get the event from this server using the id provided
  const event = (await Gamer.database.models.event.findOne({
    id: eventID,
    guildID: message.channel.guild.id
  })) as GamerEvent | null
  if (!event) return message.channel.createMessage(language(`events/events:INVALID_EVENT`))

  // If an old event card exists in a different channel get rid of it
  if (event.adChannelID && event.adMessageID && event.adChannelID !== message.channel.id) {
    Gamer.deleteMessage(event.adChannelID, event.adMessageID, `Event card moved to ${message.channel.name}`)
  }

  const channelID = message.channelMentions?.length ? message.channelMentions[0] : message.channel.id
  return Gamer.helpers.events.advertiseEvent(event, channelID)
})
