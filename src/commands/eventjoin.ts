import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GamerEvent } from '../lib/types/gamer'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default new Command([`eventjoin`, `ej`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const [number] = args
  const eventID = parseInt(number, 10)

  // Get the event from this server using the id provided
  const event = (await Gamer.database.models.event.findOne({
    id: eventID,
    guildID: message.channel.guild.id
  })) as GamerEvent | null
  if (!event) return message.channel.createMessage(language(`events/events:INVALID_EVENT`))

  if (event.attendees.includes(message.author.id))
    return message.channel.createMessage(language(`events/eventjoin:ALREADY_JOINED`))

  // Does the user have the roles necessary to join this event OR If no roles were set everyone is allowed
  const hasPermission = event.allowedRoleIDs.length
    ? message.member.roles.some(roleID => event.allowedRoleIDs.includes(roleID))
    : true

  if (!hasPermission) {
    const embed = new GamerEmbed().setAuthor(message.author.username, message.author.avatarURL).setDescription(
      language(`events/eventjoin:MISSING_ALLOWED_ROLES`, {
        roles: event.allowedRoleIDs.map(id => `<@&${id}>`).join(', ')
      })
    )
    return message.channel.createMessage({ embed: embed.code })
  }

  const response = Gamer.helpers.events.joinEvent(event, message.author.id, language)

  return message.channel.createMessage(response)
})
