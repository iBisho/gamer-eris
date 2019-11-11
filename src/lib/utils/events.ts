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
      end: template ? template.duration : 3600000,
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
      dmReminders: template ? template.dmReminders : true
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
      const emojis = [
        constants.emojis.greenTick,
        constants.emojis.redX,
        constants.emojis.members,
        constants.emojis.hourglass,
        constants.emojis.denials,
        constants.emojis.thinking
      ]
      for (const emoji of emojis) {
        const reaction = this.Gamer.helpers.discord.convertEmoji(emoji, `reaction`)
        if (reaction) eventCardReactions.push(reaction)
      }
    }

    const imageChannel = this.Gamer.getChannel(config.channelIDs.imageStorage)
    if (!imageChannel || !(imageChannel instanceof TextChannel)) return
    const result = await imageChannel.createMessage('', { file: buffer, name: `gamer-event-card` })
    const embed = new GamerEmbed().setTimestamp(event.start).setImage(result.attachments[0].proxy_url)

    const adChannel = channelID
      ? this.Gamer.getChannel(channelID)
      : event.adChannelID
      ? this.Gamer.getChannel(event.adChannelID)
      : undefined
    if (adChannel && adChannel instanceof TextChannel) {
      const adCardMessage = event.adMessageID
        ? adChannel.messages.get(event.adMessageID) || (await adChannel.getMessage(event.adMessageID))
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
    const eventAuthor = this.Gamer.users.get(event.authorID) || `Unknown User#0000`

    const customBackgroundBuffer = event.backgroundURL
      ? await fetch(event.backgroundURL).then(res => res.buffer())
      : undefined

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
      .addImage(this.Gamer.buffers.events.calendar, 34, 177)
      .addImage(this.Gamer.buffers.events.members, 34, 267)
      .addImage(this.Gamer.buffers.events.waiting, 278, 267)
      .addImage(this.Gamer.buffers.events.denials, 466, 267)
      .addImage(this.Gamer.buffers.events.clock, 345, 177)
      .setAntialiasing(`subpixel`)

    // #region event title
    canvas
      .setTextAlign(`left`)
      .setColor(`#FFFFFF`)
      .setTextFont(`26px SFTHeavy`)
      .addMultilineText(event.title, 30, 90)
      // #endregion

      // #region event author
      .setTextAlign(`left`)
      .setTextFont(`14px SFTHeavy`)
      .addText(`Created by ${eventAuthor}`, 30, 145)
      // #endregion

      // #region event id
      .setTextFont(`18px SFTHeavy`)
      .setTextAlign(`center`)
      .setColor(event.backgroundURL ? `#FFFFFF` : `#4C4C4C`)
      .addResponsiveText(`ID: ${event.id}`, 568, 48, 75)
      // #endregion

      // #region members
      .setTextAlign(`left`)
      .setTextFont(`16px SFTHeavy`)
      .setColor(`#4C4C4C`)
      .addText(`ATTENDING`, 64, 281)
      // #endregion

      // #region event attending amount
      .setTextAlign(`left`)
      .setColor(`#9B9B9B`)
      .setTextFont(`16px SFTHeavy`)
      .addText(`${event.attendees.length} / ${event.maxAttendees}`, 155, 281)
      // #endregion

      // #region waiting list
      .setColor(`#4C4C4C`)
      .setTextAlign(`left`)
      .setTextFont(`16px SFTHeavy`)
      .addText(`WAITING LIST`, 300, 281)
      // #endregion

      // #region event waiting list amount
      .setTextAlign(`left`)
      .setColor(`#9B9B9B`)
      .setTextFont(`16px SFTHeavy`)
      .addText(event.waitingList.length.toString(), 414, 281)
      // #endregion

      // #region event Denials List text
      .setColor(`#4C4C4C`)
      .setTextAlign(`left`)
      .setTextFont(`16px SFTHeavy`)
      .addText(`DENIALS`, 491, 281)
      // #endregion

      // #region event denials amount
      .setTextAlign(`left`)
      .setColor(`#9B9B9B`)
      .setTextFont(`16px SFTHeavy`)
      .addText(event.denials.length.toString(), 565, 281)
      // #endregion

      // #region event Duration
      .setTextAlign(`left`)
      .setColor(`#4A4A4A`)
      .setTextFont(`16px SFTHeavy`)
      .addText(this.Gamer.helpers.transform.humanizeMilliseconds(event.duration), 375, 192)
      // #endregion

      // #region event Time start
      .setTextAlign(`left`)
      .setColor(`#4A4A4A`)
      .setTextFont(`16px SFTHeavy`)
      // .addText(startDate, 64, 192)
      // #endregion

      // #region event Game Name
      .setColor(`#4A4A4A`)
      .setTextAlign(`left`)
      .setTextFont(`24px SFTHeavy`)
      .addText(event.game, 35, 241)
    // #endregion

    const gameWidth = canvas.measureText(event.game)
    const platformStartsAt = 35 + 15 + gameWidth // 15 are the difference between game and platform

    canvas
      // #region event Platform Name
      .setTextAlign(`left`)
      .setColor(`#7ED321`)
      .setTextFont(`18px SFTHeavy`)
      .addText(event.platform, platformStartsAt, 241)
    // #endregion

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
      canvas.addImage(this.Gamer.buffers.events.tag, 34 + i * 115, 308)
      canvas
        .setTextAlign(`center`)
        .setColor(`#4A4A4A`)
        .setTextFont(`14px SFTHeavy`)
        .addText(`#${t}`, 86 + i * 115, 326)
      i++
    }

    return canvas.toBufferAsync()
  }

  listEvents(events: GamerEvent[]) {
    const now = Date.now()
    const sortedEvents = events.sort((a, b) => a.id - b.id)

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

  
}
