import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'
import { GamerEvent } from '../lib/types/gamer'

export default new Command([`eventadvertise`, `ead`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings ? guildSettings.staff.modRoleIDs : []) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : `en-US`)
  if (!language) return

  const [number] = args
  const eventID = parseInt(number, 10)

  // Get the event from this server using the id provided
  const event = (await Gamer.database.models.event.findOne({
    id: eventID,
    guildID: message.channel.guild.id
  })) as GamerEvent | null
  if (!event) return message.channel.createMessage(language(`events/event:INVALID_EVENT`))

  // If an old event card exists in a different channel get rid of it
  if (event.adChannelID && event.adMessageID && event.adChannelID !== message.channel.id) {
    Gamer.deleteMessage(event.adChannelID, event.adMessageID, `Event card moved to ${message.channel.name}`)
  }

  return Gamer.helpers.events.advertiseEvent(event, message.channel.id)
})
