import { TwitchStream } from '../../services/twitch/api'
import { GamerSubscription } from '../../database/schemas/subscription'
import { MessageEmbed } from 'helperis'
import Gamer from '../..'
import constants from '../../constants'

export function twitchAlert(subscription: GamerSubscription, data: null | TwitchStream) {
  // If no data the user went offline so we dont need to send any alert
  if (!data) return

  const imageURL = data.thumbnail_url.replace('{width}', '720').replace('{height}', '380')

  const embed = new MessageEmbed()
    .setDescription(`[${data.title}](https://twitch.tv/${subscription.username})`)
    .setImage(imageURL)
    .setColor(`#6441A4`)
    .setTimestamp()

  // Since the user went online we need to send the alert to all the subscribing channels
  for (const sub of subscription.subs) {
    // Get the guild specific language
    const language = Gamer.i18n.get(Gamer.guildLanguages.get(sub.guildID) || `en-US`)
    if (!language) continue

    const guild = Gamer.guilds.get(sub.guildID)
    if (!guild) continue

    const channel = guild.channels.get(sub.channelID)
    if (!channel) continue

    const botPerms = channel.permissionsOf(Gamer.user.id)
    if (!botPerms.has('readMessages') || !botPerms.has('sendMessages') || !botPerms.has('embedLinks')) continue

    embed.setTitle(
      language(`gaming/twitch:TITLE`, {
        emoji: constants.emojis.online,
        username: subscription.username
      })
    )

    Gamer.createMessage(sub.channelID, { embed: embed.code })
  }
}
