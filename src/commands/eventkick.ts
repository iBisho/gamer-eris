import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'
import { GamerEvent } from '../lib/types/gamer'

export default new Command([`eventkick`, `ek`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

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

  const [number, userID] = args
  const eventID = parseInt(number, 10)
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  if (!eventID) return helpCommand.process(message, [`eventkick`], context)
  const user = message.mentions.length ? message.mentions[0] : Gamer.users.get(userID)
  if (!user) return message.channel.createMessage(language(`events/eventkick:NEED_USER`))

  // Get the event from this server using the id provided
  const event = (await Gamer.database.models.event.findOne({
    id: eventID,
    guildID: message.channel.guild.id
  })) as GamerEvent | null
  if (!event) return message.channel.createMessage(language(`events/events:INVALID_EVENT`))

  if (!event.attendees.includes(user.id) && !event.waitingList.includes(user.id))
    return message.channel.createMessage(language(`events/eventkick:NOT_JOINED`))

  Gamer.helpers.events.leaveEvent(event, user.id)

  return message.channel.createMessage(language(`events/eventkick:KICKED`))
})
