import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'
import { GamerEvent } from '../lib/types/gamer'

export default new Command([`eventedit`, `ee`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings ? guildSettings.staff.modRoleIDs : []) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  const [number, type, ...fullValue] = args
  const eventID = parseInt(number, 10)
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  if (!eventID || !type) return helpCommand.execute(message, [`eventadd`], context)

  // toggles dont need a value
  if (!fullValue.length && ![`repeat`, `remove`, `dm`, `dms`, `showattendees`].includes(type.toLowerCase())) return
  const [value] = fullValue

  // Get the event from this server using the id provided
  const event = (await Gamer.database.models.event.findOne({
    id: eventID,
    guildID: message.channel.guild.id
  })) as GamerEvent | null
  if (!event) return message.channel.createMessage(language(`events/events:INVALID_EVENT`))

  let response = `events/eventedit:TITLE_UPDATED`
  switch (type.toLowerCase()) {
    case `title`:
      event.title = fullValue.join(' ')
      break
    case `platform`:
      event.platform = fullValue.join(' ')
      response = `events/eventedit:PLATFORM_UPDATED`
      break
    case `game`:
      event.game = fullValue.join(' ')
      response = `events/eventedit:GAME_UPDATED`
      break
    case `activity`:
      event.activity = fullValue.join(' ')
      response = `events/eventedit:ACTIVITY_UPDATED`
      break
    case `description`:
      event.description = fullValue.join(' ')
      response = `events/eventedit:DESCRIPTION_UPDATED`
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
    case `showattendees`:
      event.showAttendees = !event.showAttendees
      response = `events/eventedit:SHOWATTENDEES_UPDATED`
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

      event.start = Date.now() + start
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
