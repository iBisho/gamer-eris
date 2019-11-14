import { Message, PrivateChannel, TextChannel } from 'eris'
import { GuildSettings } from '../types/settings'
import GamerClient from '../structures/GamerClient'
import { GamerEvent } from '../types/gamer'
import fetch from 'node-fetch'
import { Canvas } from 'canvas-constructor'
import constants from '../../constants'
import GamerEmbed from '../structures/GamerEmbed'
import config from '../../../config'
import { TFunction } from 'i18next'

const eventCardReactions: string[] = []

export default class {
  Gamer: GamerClient

  constructor(client: GamerClient) {
    this.Gamer = client
  }

  async createNewEvent(message: Message, templateName = ``, guildSettings: GuildSettings | null) {
    if (message.channel instanceof PrivateChannel) return

    const events = (await this.Gamer.database.models.event.find({ guildID: message.channel.guild.id })) as GamerEvent[]

    const template = templateName
      ? events.find(event => event.templateName && event.templateName === templateName)
      : undefined

    const language = this.Gamer.i18n.get(guildSettings ? guildSettings.language : `en-US`)
    if (!language) return

    const startNow = (template ? template.minutesFromNow : 60) * 60000 + Date.now()

    const newEvent = {
      id: this.createNewID(events),
      authorID: message.author.id,
      guildID: message.channel.guild.id,
      // now + X minutes
      start: startNow,
      end: startNow + (template ? template.duration : 3600000),
      duration: template ? template.duration : 3600000,
      attendees: [message.author.id],
      denials: [],
      waitingList: [],
      reminders: template ? template.reminders : [600000],
      executedReminders: [],
      title: template ? template.title : language(`events/eventcreate:DEFAULT_TITLE`),
      tags: template ? template.tags : [],
      description: template ? template.description : language(`events/eventcreate:DEFAULT_DESCRIPTION`),
      maxAttendees: template ? template.maxAttendees : 5,
      hasStarted: false,
      isRecurring: template ? template.isRecurring : false,
      frequency: template ? template.frequency : 3600000,
      adMessageID: undefined,
      adChannelID: guildSettings ? guildSettings.eventsAdvertiseChannelID : undefined,
      adCardID: undefined,
      // timezone: template.timezone,
      createdAt: Date.now(),
      platform: template ? template.platform : language(`events/eventcreate:DEFAULT_PLATFORM`),
      game: template ? template.game : language(`events/eventcreate:DEFAULT_GAME`),
      activity: template ? template.activity : language(`events/eventcreate:DEFAULT_ACTIVITY`),
      removeRecurringAttendees: template ? template.removeRecurringAttendees : false,
      allowedRoleIDs: template ? template.allowedRoleIDs : [],
      alertRoleIDs: template ? template.alertRoleIDs : [],
      dmReminders: template ? template.dmReminders : true,
      showAttendees: true
    }

    this.Gamer.database.models.event.create(newEvent)

    // add new event to events array to be sent to amplitude for product analytics
    this.Gamer.amplitude.push({
      authorID: message.author.id,
      channelID: message.channel.id,
      guildID: message.channel.guild.id,
      messageID: message.id,
      timestamp: message.timestamp,
      type: 'EVENT_CREATED'
    })

    return newEvent.id
  }

  createNewID(events: GamerEvent[]) {
    if (events.length < 1) return 1

    let id = 1

    for (const event of events) if (event.id >= id) id = event.id + 1

    return id
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

    const embed = new GamerEmbed()
      .setTitle(`Event Description:`)
      .setDescription(event.description)
      .setImage(result.attachments[0].proxy_url)
      .setTimestamp(event.start)

    const adChannel = channelID
      ? this.Gamer.getChannel(channelID)
      : event.adChannelID
      ? this.Gamer.getChannel(event.adChannelID)
      : undefined
    if (adChannel && adChannel instanceof TextChannel) {
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
        for (const emoji of eventCardReactions) await card.addReaction(emoji).catch(() => null)
      }
    }
  }

  async makeCanvas(event: GamerEvent) {
    const eventAuthor = this.Gamer.users.get(event.authorID)

    const customBackgroundBuffer = event.backgroundURL
      ? await fetch(event.backgroundURL).then(res => res.buffer())
      : undefined

      const attendees: string[] = []
      for (const id of event.attendees) {
        const user = this.Gamer.users.get(id)
        if (!user) continue
        attendees.push(`${user.username}#${user.discriminator}`)
      }


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
      .addMultilineText(event.title, 30, 70)

      // event author
      .setTextFont(`14px SFTHeavy`)
      .addText(`Created by ${eventAuthor?.username || `Unknown User#0000`}`, 30, 145)

      // event id
      .setTextFont(`18px SFTHeavy`)
      .setTextAlign(`center`)
      .setColor(event.backgroundURL ? `#FFFFFF` : `#4C4C4C`)
      .addResponsiveText(`#${event.id}`, 572, 48, 75)

      .setTextAlign(`left`)
      .setColor(`#9B9B9B`)
      .setTextFont(`16px SFTHeavy`)
      .addText(`${event.attendees.length} / ${event.maxAttendees}`, 65, 192)
      .addText(event.waitingList.length.toString(), 150, 192)
      .addText(event.denials.length.toString(), 220, 192)
      .setColor(`#4A4A4A`)
      .addText(this.Gamer.helpers.transform.humanizeMilliseconds(event.duration), 290, 192)
      .setTextFont(`24px SFTHeavy`)
      .addText(event.game, 35, 241)
      .setColor(`#7ED321`)
      .setTextFont(`18px SFTHeavy`)
      .addText(event.platform, 35, 261)
      .setColor(`#4C4C4C`)
      .setTextFont(`13px SFTHeavy`)
    // .addText(event.description.substring(0, 100), 35, 286)

    if (event.showAttendees) canvas.addText(attendees.join(', ').substring(0, 100), 35, 311)

    if (event.isRecurring) {
      canvas
        .addImage(this.Gamer.buffers.events.recurring, 68, 29)
        .setColor(`#FFFFFF`)
        .setTextAlign(`center`)
        .setTextFont(`18px SFTHeavy`)
        .addResponsiveText(this.Gamer.helpers.transform.humanizeMilliseconds(event.frequency), 175, 50, 158)
    }

    let i = 0

    for (const t of event.tags) {
      // draw it
      canvas.addImage(this.Gamer.buffers.events.tag, 34 + i * 115, 320)
      canvas
        .setTextAlign(`center`)
        .setColor(`#4A4A4A`)
        .setTextFont(`14px SFTHeavy`)
        .addText(`#${t}`, 86 + i * 115, 340)
      i++
    }

    return canvas.toBufferAsync()
  }

  listEvents(events: GamerEvent[]) {
    const now = Date.now()
    const sortedEvents = events.sort((a, b) => a.id - b.id).slice(0, 12)

    return sortedEvents
      .map(event => {
        let textString = `**[${event.id}] `

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
      event.save()

      this.advertiseEvent(event)
      return language(`events/eventjoin:SUCCESSFULLY_JOINED`)
    }

    // There is no space and this user is already waiting
    if (event.waitingList.includes(userID)) return language(`events/eventjoin:ALREADY_WAITING_RESPONSE`)

    // add user to waiting list
    event.denials = event.denials.filter(d => d !== userID)
    event.waitingList = [...event.waitingList, userID]
    event.save()

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
    const events = (await this.Gamer.database.models.event.find()) as GamerEvent[]
    // If there are no events or some error happened just cancel out
    if (!events.length) return
    // Create the timestamp for right now so we can reuse it
    const now = Date.now()

    const eventsToEnd: GamerEvent[] = []
    const eventsToStart: GamerEvent[] = []
    const eventsToRemind: GamerEvent[] = []

    for (const event of events) {
      if (event.end < now) eventsToEnd.push(event)
      else if (event.start < now && !event.hasStarted && event.end > now) eventsToStart.push(event)
      else if (event.start > now && !event.hasStarted && event.attendees.length) eventsToStart.push(event)
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
      return this.Gamer.database.models.event.deleteOne({ id: event.id, guildID: event.guildID })
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

    const guildSettings = (await this.Gamer.database.models.guild.findOne({ id: guild.id })) as GuildSettings | null

    const language = this.Gamer.i18n.get(guildSettings ? guildSettings.language : `en-US`)
    if (!language) return

    const embed = new GamerEmbed()
      .setAuthor(language(`events/event:STARTING_GUILD`, { eventID: event.id, guildName: guild.name }))
      .setTitle(language(`events/event:STARTING_TITLE`, { title: event.title }))
      .addField(language(`events/eventshow:RSVP_EMOJI`), `${event.attendees.length} / ${event.maxAttendees}`)
      .addField(language(`events/eventshow:DESC_EMOJI`), event.description)

    if (guild.iconURL) embed.setThumbnail(guild.iconURL)

    for (const userID of event.attendees) {
      const user = this.Gamer.users.get(userID)
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
  }

  async remindEvent(event: GamerEvent) {
    const guild = this.Gamer.guilds.get(event.guildID)
    if (!guild) return

    const reminder = event.reminders.find(
      reminder => !event.executedReminders.includes(reminder) && event.start - Date.now() > reminder
    )
    if (!reminder) return
    event.executedReminders.push(reminder)
    event.save()

    const guildSettings = (await this.Gamer.database.models.guild.findOne({ id: guild.id })) as GuildSettings | null

    const language = this.Gamer.i18n.get(guildSettings ? guildSettings.language : `en-US`)
    if (!language) return

    const startsIn = this.Gamer.helpers.transform.humanizeMilliseconds(Date.now() - event.start)

    const embed = new GamerEmbed()
      .setAuthor(language(`events/event:REMIND`, { eventID: event.id }))
      .setDescription(event.description)
      .addField(language(`events/event:TITLE`), event.title, true)
      .addField(language(`events/event:STARTS_IN`), startsIn, true)
      .setFooter(language(`events/event:REMIND_FOOTER`, { guildName: guild.name }))
    if (guild.iconURL) embed.setThumbnail(guild.iconURL)

    if (event.dmReminders) {
      for (const userID of event.attendees) {
        const user = this.Gamer.users.get(userID)
        if (!user) continue

        user
          .getDMChannel()
          // send message or catch rejected promise if user has dms off
          .then(channel => channel.createMessage({ embed: embed.code }).catch(() => undefined))
          // Catch the promise from dmchannel
          .catch(() => undefined)
      }
    }

    const adChannel = event.adChannelID ? guild.channels.get(event.adChannelID) : undefined
    if (!adChannel || !(adChannel instanceof TextChannel)) return

    const botPerms = adChannel.permissionsOf(this.Gamer.user.id)

    if (!botPerms.has('readMessages') || !botPerms.has('sendMessages') || !botPerms.has('embedLinks')) return

    adChannel.createMessage({
      content: event.alertRoleIDs.map((id: string) => `<@&${id}>`).join(` `),
      embed: embed.code
    })
  }
}
