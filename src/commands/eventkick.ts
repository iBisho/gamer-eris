import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'
import { GamerEvent } from '../lib/types/gamer'

export default new Command([`eventleave`, `el`], async (message, args, context) => {
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

  const [number, userID] = args
  const eventID = parseInt(number, 10)

  const user = message.mentions.length ? message.mentions[0] : Gamer.users.get(userID)
  if (!user) return message.channel.createMessage(language(`events/eventkick:NEED_USER`))

  // Get the event from this server using the id provided
  const event = (await Gamer.database.models.event.findOne({
    id: eventID,
    guildID: message.channel.guild.id
  })) as GamerEvent | null
  if (!event) return message.channel.createMessage(language(`events/event:INVALID_EVENT`))

  if (!event.attendees.includes(user.id) && !event.waitingList.includes(user.id))
    return message.channel.createMessage(language(`events/eventkick:NOT_JOINED`))

  Gamer.helpers.events.leaveEvent(event, user.id)

  return message.channel.createMessage(language(`events/eventkick:KICKED`))
})
