import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'
import { GamerEvent } from '../lib/types/gamer'

export default new Command([`eventedit`, `ee`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : `en-US`)
  if (!language) return

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings ? guildSettings.staff.modRoleIDs : []) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  const [number, type, value] = args
  const eventID = parseInt(number, 10)
  if (!eventID || !type || !value) return

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  // Get the event from this server using the id provided
  const event = (await Gamer.database.models.event.findOne({
    id: eventID,
    guildID: message.channel.guild.id
  })) as GamerEvent | null
  if (!event) return message.channel.createMessage(language(`events/event:INVALID_EVENT`))

  let response = `events/eventedit:TITLE_UPDATED`
  switch (type.toLowerCase()) {
    case `title`:
      event.title = value
      break
    case `tags`:
      const tagName = value.toLowerCase()
      const exists = event.tags.includes(tagName)
      if (exists) event.tags = event.tags.filter(tag => tag === tagName)
      else event.tags.push(tagName)
      response = `events/eventedit:TAGS_UPDATED`
      break
    case `background`:
      if (!guildSettings?.vip.isVIP) return message.channel.createMessage(language(`events/eventedit:VIP_BACKGROUND`))
      event.backgroundURL = value
      response = `events/eventedit:BACKGROUND_UPDATED`
      break
    case `description`:
      event.description = value
      response = `events/eventedit:DESCRIPTION_UPDATED`
      break
    case `attendees`:
      const maxAttendees = parseInt(value, 10)
      if (!maxAttendees) return
      event.maxAttendees = maxAttendees
      response = `events/eventedit:ATTENDEES_UPDATED`
      break
    case `repeat`:
      event.isRecurring = !event.isRecurring
      response = `events/eventedit:REPEAT_UPDATED`
      break
    case `remove`:
      event.removeRecurringAttendees = !event.removeRecurringAttendees
      response = `events/eventedit:REMOVE_UPDATED`
      break
    case `dm`:
    case `dms`:
      event.dmReminders = !event.dmReminders
      response = `events/eventedit:DM_UPDATED`
      break
    case `platform`:
      event.platform = value
      response = `events/eventedit:PLATFORM_UPDATED`
      break
    case `game`:
      event.game = value
      response = `events/eventedit:GAME_UPDATED`
      break
    case `activity`:
      event.activity = value
      response = `events/eventedit:ACTIVITY_UPDATED`
      break
    case `reminder`:
      const reminder = Gamer.helpers.transform.stringToMilliseconds(value)
      if (!reminder) return helpCommand.execute(message, [`eventedit`], context)

      if (event.reminders.includes(reminder)) event.reminders = event.reminders.filter(r => r === reminder)
      else event.reminders.push(reminder)
      response = `events/eventedit:REMINDERS_UPDATED`
      break
    case `frequency`:
      const frequency = Gamer.helpers.transform.stringToMilliseconds(value)
      if (!frequency) return helpCommand.execute(message, [`eventedit`], context)

      event.frequency = frequency
      response = `events/eventedit:FREQUENCY_UPDATED`
      break
    case `duration`:
      const duration = Gamer.helpers.transform.stringToMilliseconds(value)
      if (!duration) return helpCommand.execute(message, [`eventedit`], context)

      event.duration = duration
      response = `events/eventedit:DURATION_UPDATED`
      break
    case `start`:
      const start = Gamer.helpers.transform.stringToMilliseconds(value)
      if (!start) return helpCommand.execute(message, [`eventedit`], context)

      event.start = start
      response = `events/eventedit:START_UPDATED`
      break
    case `alertrole`:
      const roleToAlert =
        message.channel.guild.roles.get(value) ||
        message.channel.guild.roles.find(r => r.name.toLowerCase() === value.toLowerCase())
      if (!roleToAlert) return helpCommand.execute(message, [`eventedit`], context)

      if (event.alertRoleIDs.includes(roleToAlert.id))
        event.alertRoleIDs = event.alertRoleIDs.filter(id => id !== roleToAlert.id)
      else event.alertRoleIDs.push(roleToAlert.id)
      response = `events/eventedit:ALERTROLE_UPDATED`
      break
    case `allowedrole`:
      const allowedRole =
        message.channel.guild.roles.get(value) ||
        message.channel.guild.roles.find(r => r.name.toLowerCase() === value.toLowerCase())
      if (!allowedRole) return helpCommand.execute(message, [`eventedit`], context)

      if (event.allowedRoleIDs.includes(allowedRole.id))
        event.allowedRoleIDs = event.allowedRoleIDs.filter(id => id !== allowedRole.id)
      else event.allowedRoleIDs.push(allowedRole.id)
      response = `events/eventedit:ALLOWEDROLE_UPDATED`
      break
    case `template`:
      event.templateName = value
      response = `events/eventedit:TEMPLATE_UPDATED`
      break
    default:
      // If they used the command wrong show them the help
      return helpCommand.execute(message, [`eventedit`], context)
  }

  // Save any change to the events
  event.save()
  message.channel.createMessage(language(response))

  const eventshowCommand = Gamer.commandForName(`eventshow`)
  if (!eventshowCommand) return

  return eventshowCommand.execute(message, [eventID.toString()], context)
})