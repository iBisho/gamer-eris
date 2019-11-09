import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'
import { GamerEvent } from '../lib/types/gamer'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default new Command([`eventshow`, `es`], async (message, args, context) => {
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

  const [eventID] = args
  if (!eventID) return message.channel.createMessage(language(`events/event:NEED_EVENT_ID`))

  // Get the event from this server using the id provided
  const event = (await Gamer.database.models.event.findOne({
    id: eventID,
    guildID: message.channel.guild.id
  })) as GamerEvent | null
  if (!event) return message.channel.createMessage(language(`events/event:INVALID_EVENT`))

  const attendees = Gamer.helpers.discord.idsToUserTag(event.attendees)
  const waitingList = Gamer.helpers.discord.idsToUserTag(event.waitingList)
  const denials = Gamer.helpers.discord.idsToUserTag(event.denials)

  const NONE = language(`common:NONE`)

  const embed = new GamerEmbed()
    .setAuthor(message.author.username, message.author.avatarURL)
    .addField(
      language(`events/event:EDIT_BASIC`),
      language(`events/eventshow:BASIC`, {
        title: event.title,
        tags: event.tags.length ? event.tags.join(`, `) : language('common:NONE')
      })
    )
    .addField(
      language(`events/event:EDIT_TIME`),
      language(`events/eventshow:TIME`, { duration: Gamer.helpers.transform.humanizeMilliseconds(event.duration) })
    )
    .addField(language(`events/event:EDIT_DESC`), event.description)
    .addField(
      language(`events/event:EDIT_RSVP`),
      language(`events/eventshow:RSVP`, {
        stats: `${event.attendees.length} / ${event.maxAttendees}`,
        attendees: attendees.length ? attendees : NONE,
        waitingList: waitingList.length ? waitingList : NONE,
        denials: denials.length ? denials : NONE
      })
    )
    .addField(
      language(`events/event:EDIT_GAMING`),
      language(`events/eventshow:GAMING`, { platform: event.platform, game: event.game, activity: event.activity })
    )
    .setFooter(language(`events/eventshow:STARTS_AT`))
    .setTimestamp(event.start)

  return message.channel.createMessage({ embed: embed.code })
})
