import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`eventedit`, `ee`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  const language = Gamer.getLanguage(message.guildID)

  // When this boolean is true the user is not a mod/admin so we need to check if they are the event creator
  let checkCreator = false
  // Mods/admins are allowed to edit any event
  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings?.staff.modRoleIDs) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  ) {
    // If the user is not a mod or admin check the events create rols
    if (!guildSettings?.roleIDs.eventsCreate) return
    if (!message.member.roles.includes(guildSettings.roleIDs.eventsCreate)) return
    checkCreator = true
  }

  const [number, type, ...fullValue] = args
  const eventID = parseInt(number, 10)
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  if (!eventID || !type) return helpCommand.process(message, [`eventedit`], context)

  // toggles dont need a value
  if (!fullValue.length && ![`repeat`, `remove`, `dm`, `dms`, `showattendees`].includes(type.toLowerCase())) return
  const [value] = fullValue

  // Get the event from this server using the id provided
  const event = await Gamer.database.models.event.findOne({
    id: eventID,
    guildID: message.guildID
  })
  if (!event) return message.channel.createMessage(language(`events/events:INVALID_EVENT`))
  if (checkCreator && event.authorID !== message.author.id) return

  const roleID = message.roleMentions.length ? message.roleMentions[0] : value

  let response = `events/eventedit:TITLE_UPDATED`
  switch (type.toLowerCase()) {
    case `title`:
    case `1`:
      event.title = fullValue.join(' ')
      break
    case `description`:
    case `2`:
      event.description = fullValue.join(' ')
      response = `events/eventedit:DESCRIPTION_UPDATED`
      break
    case `platform`:
    case `6`:
      event.platform = fullValue.join(' ')
      response = `events/eventedit:PLATFORM_UPDATED`
      break
    case `game`:
    case `7`:
      event.game = fullValue.join(' ')
      response = `events/eventedit:GAME_UPDATED`
      break
    case `activity`:
    case `8`:
      event.activity = fullValue.join(' ')
      response = `events/eventedit:ACTIVITY_UPDATED`
      break
    case `background`:
      if (!guildSettings?.vip.isVIP) return message.channel.createMessage(language(`events/eventedit:VIP_BACKGROUND`))
      event.backgroundURL = value
      response = `events/eventedit:BACKGROUND_UPDATED`
      break
    case `attendees`:
    case `5`:
      const maxAttendees = parseInt(value, 10)
      if (!maxAttendees) return
      while (event.attendees.length < maxAttendees && event.waitingList.length)
        Gamer.helpers.events.transferFromWaitingList(event)
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
    case `9`:
      event.dmReminders = !event.dmReminders
      response = `events/eventedit:DM_UPDATED`
      break
    case `showattendees`:
      event.showAttendees = !event.showAttendees
      response = `events/eventedit:SHOWATTENDEES_UPDATED`
      break
    case `reminder`:
    case `4`:
      const reminder = Gamer.helpers.transform.stringToMilliseconds(value)
      if (!reminder) return helpCommand.process(message, [`eventedit`], context)

      if (event.reminders.includes(reminder)) event.reminders = event.reminders.filter(r => r === reminder)
      else event.reminders.push(reminder)
      response = `events/eventedit:REMINDERS_UPDATED`
      break
    case `frequency`:
      const frequency = Gamer.helpers.transform.stringToMilliseconds(value)
      if (!frequency) return helpCommand.process(message, [`eventedit`], context)

      event.frequency = frequency
      response = `events/eventedit:FREQUENCY_UPDATED`
      break
    case `duration`:
    case `3`:
      const duration = Gamer.helpers.transform.stringToMilliseconds(value)
      if (!duration) return helpCommand.process(message, [`eventedit`], context)

      event.duration = duration
      event.end = event.start + event.duration
      response = `events/eventedit:DURATION_UPDATED`
      break
    case `start`:
    case `12`:
      const start = Gamer.helpers.transform.stringToMilliseconds(value)
      const startTime = new Date(fullValue.join(' ')).getTime()

      if (!start && !startTime) return helpCommand.process(message, [`eventedit`], context)

      event.start = start ? Date.now() + start : startTime
      event.end = event.start + event.duration
      response = `events/eventedit:START_UPDATED`
      break
    case `allowedrole`:
    case `10`:
      const allowedRole =
        message.member.guild.roles.get(roleID) ||
        message.member.guild.roles.find(r => r.name.toLowerCase() === fullValue.join(' ').toLowerCase())
      if (!allowedRole) return helpCommand.process(message, [`eventedit`], context)

      if (event.allowedRoleIDs.includes(allowedRole.id))
        event.allowedRoleIDs = event.allowedRoleIDs.filter(id => id !== allowedRole.id)
      else event.allowedRoleIDs.push(allowedRole.id)
      response = `events/eventedit:ALLOWEDROLE_UPDATED`
      break
    case `alertrole`:
    case `11`:
      const roleToAlert =
        message.member.guild.roles.get(roleID) ||
        message.member.guild.roles.find(r => r.name.toLowerCase() === fullValue.join(' ').toLowerCase())
      if (!roleToAlert) return helpCommand.process(message, [`eventedit`], context)

      if (event.alertRoleIDs.includes(roleToAlert.id))
        event.alertRoleIDs = event.alertRoleIDs.filter(id => id !== roleToAlert.id)
      else event.alertRoleIDs.push(roleToAlert.id)
      response = `events/eventedit:ALERTROLE_UPDATED`
      break

    case `template`:
      event.templateName = value
      response = `events/eventedit:TEMPLATE_UPDATED`
      break
    default:
      // If they used the command wrong show them the help
      return helpCommand.process(message, [`eventedit`], context)
  }

  // Save any change to the events
  await event.save()
  message.channel.createMessage(language(response))
  Gamer.helpers.events.advertiseEvent(event)

  const eventshowCommand = Gamer.commandForName(`eventshow`)
  if (!eventshowCommand) return

  return eventshowCommand.process(message, [eventID.toString()], context)
})
