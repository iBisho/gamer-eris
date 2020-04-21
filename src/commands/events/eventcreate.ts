import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { milliseconds } from '../../lib/types/enums/time'

export default new Command([`eventcreate`, `ec`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })

  if (
    !Gamer.helpers.discord.isModOrAdmin(message, guildSettings) &&
    (!guildSettings?.roleIDs.eventsCreate ||
      (guildSettings.roleIDs.eventsCreate !== message.guildID &&
        !message.member.roles.includes(guildSettings.roleIDs.eventsCreate)))
  )
    return

  const [templateName] = args
  // create new event based on input
  const eventID = await Gamer.helpers.events.createNewEvent(message, templateName, guildSettings)
  const language = Gamer.getLanguage(message.guildID)
  if (!eventID) return message.channel.createMessage(language(`events/eventcreate:CREATE_FAILED`))
  // Let the user know it succeeded
  message.channel.createMessage(language(`events/eventcreate:CREATE_SUCCESS`, { number: eventID }))

  if (!guildSettings?.vip.isVIP) {
    // Run the show command for this event so they can see the event details
    const eventshowCommand = Gamer.commandForName(`eventshow`)
    if (!eventshowCommand) return
    eventshowCommand.process(message, [eventID.toString()], context)
  }

  const prefix = Gamer.guildPrefixes.get(message.guildID) || Gamer.prefix
  const EVENT_EDIT_EXTENDED_HELP = language(`events/eventedit:EXTENDED`, { prefix })

  const regex = new RegExp(`${prefix}ee # `, 'gi')

  const event = await Gamer.database.models.event.findOne({
    id: eventID,
    guildID: message.guildID
  })
  if (!event) return

  if (!guildSettings?.vip.isVIP) return Gamer.helpers.events.advertiseEvent(event)

  // VIP EVENT CREATE
  const helperMessage = await Gamer.helpers.discord.embedResponse(message, EVENT_EDIT_EXTENDED_HELP.replace(regex, ``))
  Gamer.helpers.events.advertiseEvent(event, message.channel.id)

  return Gamer.collectors.set(message.author.id, {
    authorID: message.author.id,
    channelID: message.channel.id,
    createdAt: Date.now(),
    guildID: message.guildID,
    data: {
      language
    },
    callback: async (msg, collector) => {
      if (!msg.guildID || !msg.member) return

      const CANCEL_OPTIONS = language(`common:CANCEL_OPTIONS`, { returnObjects: true })
      if ([`q`, `quit`, ...CANCEL_OPTIONS].includes(msg.content)) {
        message.channel.createMessage(language(`events/eventcreate:SAVED`, { mention: msg.author.mention }))
        helperMessage.delete().catch(() => undefined)
        return
      }

      const options = [
        `title`,
        `description`,
        `platform`,
        `game`,
        `activity`,
        `background`,
        `attendees`,
        `repeat`,
        `remove`,
        `dm`,
        `dms`,
        `showattendees`,
        `reminder`,
        `frequency`,
        `duration`,
        `start`,
        `allowedrole`,
        `alertrole`,
        `template`
      ]

      const args = msg.content.split(' ')
      const [type, ...fullValue] = args
      const [value] = fullValue
      collector.createdAt = Date.now()

      if (!options.includes(type.toLowerCase())) {
        message.channel.createMessage(language(`events/eventcreate:INVALID_EDIT`, { mention: msg.author.mention }))
        return Gamer.collectors.set(message.author.id, collector)
      }

      const roleID = message.roleMentions.length ? message.roleMentions[0] : value

      let response = `events/eventedit:TITLE_UPDATED`
      switch (type.toLowerCase()) {
        case `title`:
          event.title = fullValue.join(' ')
          break
        case `description`:
          event.description = fullValue.join(' ')
          response = `events/eventedit:DESCRIPTION_UPDATED`
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
        case `background`:
          if (!guildSettings?.vip.isVIP) {
            message.channel.createMessage(language(`events/eventedit:VIP_BACKGROUND`))
            return Gamer.collectors.set(message.author.id, collector)
          }
          event.backgroundURL = value
          response = `events/eventedit:BACKGROUND_UPDATED`
          break
        case `attendees`:
          const maxAttendees = parseInt(value, 10)
          if (!maxAttendees) return Gamer.collectors.set(message.author.id, collector)
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
          event.dmReminders = !event.dmReminders
          response = `events/eventedit:DM_UPDATED`
          break
        case `showattendees`:
          event.showAttendees = !event.showAttendees
          response = `events/eventedit:SHOWATTENDEES_UPDATED`
          break
        case `reminder`:
          const reminder = Gamer.helpers.transform.stringToMilliseconds(value)
          if (!reminder) {
            msg.channel.createMessage(language(`events/eventcreate:INVALID_TIME`, { mention: msg.author.mention }))
            return Gamer.collectors.set(message.author.id, collector)
          }

          if (event.reminders.includes(reminder)) event.reminders = event.reminders.filter(r => r === reminder)
          else event.reminders.push(reminder)
          response = `events/eventedit:REMINDERS_UPDATED`
          break
        case `frequency`:
          const frequency = Gamer.helpers.transform.stringToMilliseconds(value)
          if (!frequency) {
            msg.channel.createMessage(language(`events/eventcreate:INVALID_TIME`, { mention: msg.author.mention }))
            return Gamer.collectors.set(message.author.id, collector)
          }

          event.frequency = frequency
          response = `events/eventedit:FREQUENCY_UPDATED`
          break
        case `duration`:
          const duration = Gamer.helpers.transform.stringToMilliseconds(value)
          if (!duration) {
            msg.channel.createMessage(language(`events/eventcreate:INVALID_TIME`, { mention: msg.author.mention }))
            return Gamer.collectors.set(message.author.id, collector)
          }

          event.duration = duration
          event.end = event.start + event.duration
          response = `events/eventedit:DURATION_UPDATED`
          break
        case `start`:
          const start = Gamer.helpers.transform.stringToMilliseconds(value)
          const startTime = new Date(fullValue.join(' ')).getTime()

          if (!start && !startTime) {
            msg.channel.createMessage(language(`events/eventcreate:INVALID_TIME`, { mention: msg.author.mention }))
            return Gamer.collectors.set(message.author.id, collector)
          }

          event.start = start ? Date.now() + start : startTime
          event.end = event.start + event.duration
          response = `events/eventedit:START_UPDATED`
          break
        case `allowedrole`:
          const allowedRole =
            msg.member.guild.roles.get(roleID) ||
            msg.member.guild.roles.find(r => r.name.toLowerCase() === fullValue.join(' ').toLowerCase())
          if (!allowedRole) {
            msg.channel.createMessage(language(`events/eventcreate:INVALID_TIME`, { mention: msg.author.mention }))
            return Gamer.collectors.set(message.author.id, collector)
          }

          if (event.allowedRoleIDs.includes(allowedRole.id))
            event.allowedRoleIDs = event.allowedRoleIDs.filter(id => id !== allowedRole.id)
          else event.allowedRoleIDs.push(allowedRole.id)
          response = `events/eventedit:ALLOWEDROLE_UPDATED`
          break
        case `alertrole`:
          const roleToAlert =
            msg.member.guild.roles.get(roleID) ||
            msg.member.guild.roles.find(r => r.name.toLowerCase() === fullValue.join(' ').toLowerCase())
          if (!roleToAlert) {
            msg.channel.createMessage(language(`events/eventcreate:INVALID_TIME`, { mention: msg.author.mention }))
            return Gamer.collectors.set(message.author.id, collector)
          }

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
          msg.channel.createMessage(language(`events/eventcreate:INVALID_TIME`, { mention: msg.author.mention }))
          return Gamer.collectors.set(message.author.id, collector)
      }

      // Save any change to the events
      event.save()
      msg.channel
        .createMessage(language(response))
        .then(alert =>
          setTimeout(() => alert.delete(language(`common:CLEAR_SPAM`)).catch(() => undefined), milliseconds.SECOND * 3)
        )
      msg.delete(language(`common:CLEAR_SPAM`)).catch(() => undefined)

      Gamer.helpers.events.advertiseEvent(event)
      collector.createdAt = Date.now()
      return Gamer.collectors.set(message.author.id, collector)
    }
  })
})
