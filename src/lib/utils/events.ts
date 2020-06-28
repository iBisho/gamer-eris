import { Message, TextChannel } from 'eris'
import { GuildSettings } from '../types/settings'
import GamerClient from '../structures/GamerClient'
import fetch from 'node-fetch'
import { Canvas } from 'canvas-constructor'
import constants from '../../constants'
import { MessageEmbed } from 'helperis'
import config from '../../../config'
import { TFunction } from 'i18next'
import { deleteMessageWithID, deleteMessage } from './eris'
import { GamerEvent } from '../../database/schemas/event'

const eventCardReactions: string[] = []

export default class {
  Gamer: GamerClient

  constructor(client: GamerClient) {
    this.Gamer = client
  }

  async createNewEvent(message: Message, templateName = ``, guildSettings: GuildSettings | null) {
    if (!message.guildID) return

    const events = await this.Gamer.database.models.event.find({ guildID: message.guildID })

    const template = templateName
      ? events.find(event => event.templateName && event.templateName === templateName)
      : undefined

    const language = this.Gamer.getLanguage(message.guildID)
    const TITLE = language(`events/eventcreate:DEFAULT_TITLE`)
    const DESCRIPTION = language(`events/eventcreate:DEFAULT_DESCRIPTION`)
    const PLATFORM = language(`events/eventcreate:DEFAULT_PLATFORM`)
    const GAME = language(`events/eventcreate:DEFAULT_GAME`)
    const ACTIVITY = language(`events/eventcreate:DEFAULT_ACTIVITY`)

    // 1440 minutes in a day
    const startNow = (template?.minutesFromNow || 1440) * 60000 + Date.now()

    const newEvent = {
      eventID: this.createNewID(events),
      authorID: message.author.id,
      guildID: message.guildID,
      // now + X minutes
      start: startNow,
      end: startNow + (template?.duration || 3600000),
      duration: template?.duration || 3600000,
      attendees: [message.author.id],
      denials: [],
      waitingList: [],
      reminders: template?.reminders || [600000],
      executedReminders: [],
      title: template?.title || TITLE,
      tags: template?.tags || [],
      description: template?.description || DESCRIPTION,
      maxAttendees: template?.maxAttendees || 5,
      hasStarted: false,
      isRecurring: template?.isRecurring || false,
      frequency: template?.frequency || 3600000,
      adMessageID: undefined,
      adChannelID: guildSettings?.eventsAdvertiseChannelID,
      adCardID: undefined,
      createdAt: Date.now(),
      platform: template?.platform || PLATFORM,
      game: template?.game || GAME,
      activity: template?.activity || ACTIVITY,
      removeRecurringAttendees: template?.removeRecurringAttendees || false,
      allowedRoleIDs: template?.allowedRoleIDs || [],
      alertRoleIDs: template?.alertRoleIDs || [],
      dmReminders: template?.dmReminders || true,
      showAttendees: true,
      backgroundURL: template?.backgroundURL
    }

    await this.Gamer.database.models.event.create(newEvent)

    // add new event to events array to be sent to amplitude for product analytics
    this.Gamer.amplitude.push({
      authorID: message.author.id,
      channelID: message.channel.id,
      guildID: message.guildID,
      messageID: message.id,
      timestamp: message.timestamp,
      type: 'EVENT_CREATED'
    })

    return newEvent.eventID
  }

  createNewID(events: GamerEvent[]) {
    if (events.length < 1) return 1

    let eventID = 1

    for (const event of events) if (event.eventID >= eventID) eventID = event.eventID + 1

    return eventID
  }

  async advertiseEvent(event: GamerEvent, channelID?: string) {
    const buffer = await this.makeCanvas(event)

    if (!eventCardReactions.length) {
      const emojis = [constants.emojis.greenTick, constants.emojis.redX]
      for (const emoji of emojis) {
        const reaction = this.Gamer.helpers.discord.convertEmoji(emoji, `reaction`)
        if (reaction) eventCardReactions.push(reaction)
      }
    }

    const imageChannel = this.Gamer.getChannel(config.channelIDs.imageStorage)
    if (!imageChannel || !(imageChannel instanceof TextChannel)) return
    const result = await imageChannel.createMessage('', { file: buffer, name: `gamer-event-card` })

    const embed = new MessageEmbed()
      .setTitle(`Event Description:`)
      .setDescription(event.description)
      .setImage(result.attachments[0].proxy_url)
      .setTimestamp(event.start)

    // If this is being sent to a new channel and an old card exists we need to delete the old one
    if (channelID && event.adChannelID && event.adMessageID && event.adChannelID !== channelID) {
      deleteMessageWithID(event.adChannelID, event.adMessageID)
      event.adMessageID = undefined
      event.adChannelID = undefined
    }

    const adChannel = channelID
      ? this.Gamer.getChannel(channelID)
      : event.adChannelID
        ? this.Gamer.getChannel(event.adChannelID)
        : undefined

    if (!adChannel || !(adChannel instanceof TextChannel)) return

    if (
      !this.Gamer.helpers.discord.checkPermissions(adChannel, this.Gamer.user.id, [
        `readMessages`,
        `sendMessages`,
        `embedLinks`,
        `attachFiles`,
        `readMessageHistory`,
        `addReactions`,
        `externalEmojis`
      ])
    )
      return

    const adCardMessage = event.adMessageID
      ? adChannel.messages.get(event.adMessageID) ||
      (await adChannel.getMessage(event.adMessageID).catch(() => undefined))
      : undefined

    if (adCardMessage) adCardMessage.edit({ embed: embed.code })
    else {
      const card = await adChannel.createMessage({ embed: embed.code })
      event.adChannelID = adChannel.id
      event.adMessageID = card.id
      event.save()
      for (const emoji of eventCardReactions) await card.addReaction(emoji).catch(() => undefined)
    }
  }

  async makeCanvas(event: GamerEvent) {
    const eventAuthor = await this.Gamer.helpers.discord.fetchUser(this.Gamer, event.authorID)

    const customBackgroundBuffer = event.backgroundURL
      ? await fetch(event.backgroundURL).then(res => res.buffer())
      : undefined

    const guild = this.Gamer.guilds.get(event.guildID)

    const attendees: string[] = []

    for (const id of event.attendees) {
      if (!guild) continue

      const member = await this.Gamer.helpers.discord.fetchMember(guild, id)
      if (!member) continue

      attendees.push(`${member.nick || member.username}#${member.user.discriminator}`)
    }

    const startDate = new Date(event.start)

    const canvas = new Canvas(652, 367)
    if (customBackgroundBuffer) {
      canvas
        .setGlobalAlpha(0.85)
        .save()
        .createBeveledClip(8, 0, 636, 213, 10)
        // add the image and the gradient
        .addImage(customBackgroundBuffer, 8, 0, 636, 213, { radius: 5 })
        .printLinearGradient(0, 150, 0, 0, [
          { position: 0, color: `rgba(0, 0, 0, 0.85)` },
          { position: 0.95, color: `rgba(0, 0, 0, 0)` }
        ])
        .addRect(8, 0, 636, 213)
        .restore()
    } else {
      canvas.addImage(this.Gamer.buffers.events.background, 8, 0)
    }

    canvas
      .setGlobalAlpha(1)
      .addImage(this.Gamer.buffers.events.rectangle, 0, 145)
      .addImage(this.Gamer.buffers.events.members, 34, 177)
      .addImage(this.Gamer.buffers.events.waiting, 120, 177)
      .addImage(this.Gamer.buffers.events.denials, 190, 177)
      .addImage(this.Gamer.buffers.events.clock, 260, 177)
      .setAntialiasing(`subpixel`)

      // event title
      .setTextAlign(`left`)
      .setColor(`#FFFFFF`)
      .setTextFont(`26px SFTHeavy`)
      .addMultilineText(event.title, 30, 90)

      // event author
      .setTextFont(`14px SFTHeavy`)
      .addText(`Created by ${eventAuthor?.username || `Unknown User#0000`}`, 30, 145)

      // event id
      .setTextFont(`18px SFTHeavy`)
      .setTextAlign(`center`)
      .setColor(event.backgroundURL ? `#FFFFFF` : `#4C4C4C`)
      .addResponsiveText(`#${event.eventID}`, 572, 48, 75)

      .setTextAlign(`left`)
      .setColor(`#9B9B9B`)
      .setTextFont(`16px SFTHeavy`)
      .addText(`${event.attendees.length} / ${event.maxAttendees}`, 65, 192)
      .addText(event.waitingList.length.toString(), 150, 192)
      .addText(event.denials.length.toString(), 220, 192)
      .setColor(`#4A4A4A`)
      .addText(this.Gamer.helpers.transform.humanizeMilliseconds(event.duration), 290, 192)
      .addText(startDate.toString(), 35, 350)
      .setTextFont(`24px SFTHeavy`)
      .addText(event.game, 35, 241)
      .setColor(`#7ED321`)
      .setTextFont(`18px SFTHeavy`)
      .addText(event.platform, 35, 261)
      .setColor(`#4C4C4C`)
      .setTextFont(`13px SFTHeavy`)

    // .addText(event.description.substring(0, 100), 35, 286)

    const platformWidth = canvas.setTextFont(`18px SFTHeavy`).measureText(event.platform)
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    canvas.setTextFont(`13px SFTHeavy`).addText(event.activity, 15 + 35 + platformWidth.width, 261)

    if (event.showAttendees) {
      canvas.addResponsiveText(attendees.join(', ').substring(0, 95), 35, 311, 600)
    }

    if (event.isRecurring) {
      canvas
        .addImage(this.Gamer.buffers.events.recurring, 30, 29)
        .setColor(`#FFFFFF`)
        .setTextAlign(`center`)
        .setTextFont(`18px SFTHeavy`)
        .addResponsiveText(this.Gamer.helpers.transform.humanizeMilliseconds(event.frequency), 175, 50, 158)
    }

    return canvas.toBufferAsync()
  }

  listEvents(events: GamerEvent[]) {
    const now = Date.now()
    const sortedEvents = events.sort((a, b) => a.id - b.id).slice(0, 12)

    return sortedEvents
      .map(event => {
        let textString = `**[${event.eventID}] `

        if (event.isRecurring)
          textString += ` 🔁 (${this.Gamer.helpers.transform.humanizeMilliseconds(event.frequency)}) `

        textString += `${event.title}**\n`
        textString += `<:dotgreen:441301429555036160>\`[${event.attendees.length} / ${event.maxAttendees}]\`<:dotyellow:441301443337781248>\`[${event.waitingList.length}]\`<:dotred:441301715493584896>\`[${event.denials.length}]\` `

        if (event.start > now) {
          textString += `starts in \`${this.Gamer.helpers.transform.humanizeMilliseconds(event.start - now)}\``
        } else if (event.end > now) {
          textString += `ends in \`${this.Gamer.helpers.transform.humanizeMilliseconds(event.end - now)}\``
        } else {
          textString += `ended \`${this.Gamer.helpers.transform.humanizeMilliseconds(now - event.end)}\` ago.`
        }

        return textString
      })
      .join('\n')
  }

  joinEvent(event: GamerEvent, userID: string, language: TFunction) {
    // If there is space to join the event
    if (event.attendees.length < event.maxAttendees) {
      event.denials = event.denials.filter(d => d !== userID)
      event.waitingList = event.waitingList.filter(w => w !== userID)
      event.attendees = [...event.attendees, userID]

      this.advertiseEvent(event)
      return language(`events/eventjoin:SUCCESSFULLY_JOINED`)
    }

    // There is no space and this user is already waiting
    if (event.waitingList.includes(userID)) return language(`events/eventjoin:ALREADY_WAITING_RESPONSE`)

    // add user to waiting list
    event.denials = event.denials.filter(d => d !== userID)
    event.waitingList = [...event.waitingList, userID]

    this.advertiseEvent(event)

    return language(`events/eventjoin:SUCCESSFULLY_JOINED_WAITING_LIST`)
  }

  leaveEvent(event: GamerEvent, userID: string) {
    // Clean out this users from the lists
    event.waitingList = event.waitingList.filter(w => w !== userID)
    event.attendees = event.attendees.filter(a => a !== userID)
    // Check if there is a member waiting to be added
    this.transferFromWaitingList(event)
    // Save all changes
    event.save()
    // Update the event card
    this.advertiseEvent(event)
  }

  denyEvent(event: GamerEvent, userID: string) {
    // Clean out the users from the lists
    event.attendees = event.attendees.filter(a => a !== userID)
    event.waitingList = event.waitingList.filter(w => w !== userID)
    // Add user to denials
    event.denials = [...event.denials, userID]
    // Check if there is a member waiting to be added
    this.transferFromWaitingList(event)
    // Save all changes
    event.save()
    // Update the event card
    this.advertiseEvent(event)
  }

  transferFromWaitingList(event: GamerEvent) {
    // if there is nobody on the waiting list
    if (!event.waitingList.length || event.attendees.length >= event.maxAttendees) return
    // Get the first user id in the waiting list
    const movingUserID = event.waitingList.shift()
    if (!movingUserID) return

    // The shift will remove from waiting so just add it to attending
    event.attendees.push(movingUserID)
  }

  async process() {
    // First fetch all the events from the database
    const events = await this.Gamer.database.models.event.find()
    // If there are no events or some error happened just cancel out
    if (!events.length) return
    // Create the timestamp for right now so we can reuse it
    const now = Date.now()

    const eventsToEnd: GamerEvent[] = []
    const eventsToStart: GamerEvent[] = []
    const eventsToRemind: GamerEvent[] = []

    for (const event of events) {
      // Ignore all events that are template events
      if (event.templateName) continue
      if (event.end < now) eventsToEnd.push(event)
      else if (event.start < now && !event.hasStarted && event.end > now) eventsToStart.push(event)
      else if (event.start > now && !event.hasStarted) eventsToRemind.push(event)
    }

    for (const event of eventsToEnd) this.endEvent(event)
    for (const event of eventsToStart) this.startEvent(event)
    for (const event of eventsToRemind) this.remindEvent(event)
  }

  async endEvent(event: GamerEvent) {
    // If an event is not recurring delete it
    if (!event.isRecurring) {
      // Delete the event advertisement if it existed
      const card =
        event.adChannelID && event.adMessageID
          ? await this.Gamer.getMessage(event.adChannelID, event.adMessageID).catch(() => undefined)
          : undefined
      if (card) card.delete()
      // Deletes the event from the database
      return this.Gamer.database.models.event.deleteOne({ _id: event._id }).exec()
    }

    // add new event to events array to be sent to amplitude for product analytics
    this.Gamer.amplitude.push({
      authorID: event.authorID,
      channelID: event.adChannelID,
      guildID: event.guildID,
      messageID: event.adMessageID,
      timestamp: Date.now(),
      type: 'EVENT_CREATED'
    })

    // Need to recreate a new event since it was recurring
    // Set the start time to the next available interval
    while (event.start < Date.now()) event.start += event.frequency

    event.end = event.start + event.duration
    event.hasStarted = false
    event.executedReminders = []

    if (event.removeRecurringAttendees) {
      event.attendees = []
      event.waitingList = []
      event.denials = []
    }

    event.save()

    return this.advertiseEvent(event)
  }

  async startEvent(event: GamerEvent) {
    const guild = this.Gamer.guilds.get(event.guildID)
    if (!guild) return

    const language = this.Gamer.getLanguage(event.guildID)

    const embed = new MessageEmbed()
      .setAuthor(language(`events/events:STARTING_GUILD`, { eventID: event.eventID, guildName: guild.name }))
      .setTitle(language(`events/events:STARTING_TITLE`, { title: event.title }))
      .addField(language(`events/eventshow:RSVP_EMOJI`), `${event.attendees.length} / ${event.maxAttendees}`)
      .addField(language(`events/eventshow:DESC_EMOJI`), event.description)

    if (event.adChannelID) embed.addField(language(`events/events:GO_TO`), `<#${event.adChannelID}>`)

    if (guild.iconURL) embed.setThumbnail(guild.iconURL)

    for (const userID of event.attendees) {
      const user = await this.Gamer.helpers.discord.fetchUser(this.Gamer, userID)
      if (!user) continue

      user
        .getDMChannel()
        // send message or catch rejected promise if user has dms off
        .then(channel => channel.createMessage({ embed: embed.code }).catch(() => undefined))
        // Catch the promise from dmchannel
        .catch(() => undefined)
    }

    event.hasStarted = true
    event.save()

    const adChannel = event.adChannelID ? guild.channels.get(event.adChannelID) : undefined
    if (!adChannel || !(adChannel instanceof TextChannel)) return

    const botPerms = adChannel.permissionsOf(this.Gamer.user.id)

    if (!botPerms.has('readMessages') || !botPerms.has('sendMessages') || !botPerms.has('embedLinks')) return

    const startMessage = await adChannel.createMessage({
      content: event.alertRoleIDs.map((id: string) => `<@&${id}>`).join(` `),
      embed: embed.code
    })
    deleteMessage(startMessage, 60)
  }

  async remindEvent(event: GamerEvent) {
    const guild = this.Gamer.guilds.get(event.guildID)
    if (!guild) return

    const now = Date.now()

    const reminder = event.reminders.find(
      reminder => !event.executedReminders.includes(reminder) && event.start - now < reminder
    )
    if (!reminder) return
    event.executedReminders.push(reminder)
    event.save()

    const language = this.Gamer.getLanguage(guild.id)

    const startsIn = this.Gamer.helpers.transform.humanizeMilliseconds(event.start - now)

    const embed = new MessageEmbed()
      .setAuthor(language(`events/events:REMIND`, { eventID: event.eventID }))
      .setDescription(event.description)
      .addField(language(`events/events:TITLE`), event.title, true)
      .addField(language(`events/events:STARTS_IN`), startsIn, true)
      .setFooter(language(`events/events:REMIND_FOOTER`, { guildName: guild.name }))
    if (guild.iconURL) embed.setThumbnail(guild.iconURL)

    const adChannel = event.adChannelID ? guild.channels.get(event.adChannelID) : undefined
    if (adChannel && adChannel instanceof TextChannel) {
      const botPerms = adChannel.permissionsOf(this.Gamer.user.id)

      if (!botPerms.has('readMessages') || !botPerms.has('sendMessages') || !botPerms.has('embedLinks')) return

      const channelReminder = await adChannel.createMessage({
        content: event.alertRoleIDs.map((id: string) => `<@&${id}>`).join(` `),
        embed: embed.code
      })

      deleteMessage(channelReminder, 60)
    }

    if (!event.dmReminders) return

    if (event.adChannelID) embed.addField(language(`events/events:GO_TO`), `<#${event.adChannelID}>`)

    event.attendees.forEach(async userID => {
      const user = await this.Gamer.helpers.discord.fetchUser(this.Gamer, userID)
      if (!user) return

      user
        .getDMChannel()
        // send message or catch rejected promise if user has dms off
        .then(channel => channel.createMessage({ embed: embed.code }).catch(() => undefined))
        // Catch the promise from dmchannel
        .catch(() => undefined)
    })
  }

  async processReminders() {
    const now = Date.now()
    const reminders = await this.Gamer.database.models.reminder.find({ timestamp: { $lt: now } })
    if (!reminders.length) return

    reminders.forEach(async reminder => {
      const channel = this.Gamer.getChannel(reminder.channelID)
      if (!channel || !(channel instanceof TextChannel)) return

      const hasPermission = this.Gamer.helpers.discord.checkPermissions(channel, this.Gamer.user.id, [
        'readMessages',
        'sendMessages',
        'embedLinks'
      ])
      if (!hasPermission) return

      const guild = this.Gamer.guilds.get(reminder.guildID)
      if (!guild) return

      const member = await this.Gamer.helpers.discord.fetchMember(guild, reminder.userID)
      if (!member) {
        this.Gamer.database.models.reminder.deleteOne({ _id: reminder._id }).exec()
        return
      }

      const language = this.Gamer.getLanguage(reminder.guildID)
      const embed = new MessageEmbed()
        .setAuthor(member.username, member.avatarURL)
        .setDescription(reminder.content)
        .setFooter(language(`events/remind:REMINDING`, { id: reminder.reminderID }))

      channel.createMessage({ content: this.Gamer.helpers.discord.idsToUserTag([reminder.userID]), embed: embed.code })

      if (reminder.recurring && reminder.interval) {
        while (reminder.timestamp < now) reminder.timestamp = reminder.timestamp + reminder.interval
        reminder.save()
        return
      }

      // Delete the reminder if it is not recurring
      this.Gamer.database.models.reminder.deleteOne({ _id: reminder._id }).exec()
    })
  }
}
