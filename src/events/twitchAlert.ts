import Event from '../lib/structures/Event'
import { GamerSubscription } from '../database/schemas/subscription'
import Gamer from '..'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { TwitchStream } from '../services/twitch/api'

export default class extends Event {
  async execute(subscription: GamerSubscription, data: void | TwitchStream) {
    for (const sub of subscription.subs) {
      const language = Gamer.i18n.get(Gamer.guildLanguages.get(sub.guildID) || `en-US`)
      if (!language) continue

      const embed = new GamerEmbed().setTimestamp()

      if (!data) {
        embed
          .setAuthor(subscription.username)
          .setDescription(language(`gaming/twitch:OFFLINE`))
          .addField(
            language(`gaming/twitch:TWITCH_CHANNEL`),
            language(`gaming/twitch:HYPERLINK`, { url: `https://twitch.tv/${subscription.username}` })
          )
      }

      if (data) {
        embed
          .setAuthor(subscription.username, data.thumbnail_url)
          .addField(language(`gaming/twitch:TITLE`), data.title)
          .addField(language(`gaming/twitch:VIEWS`), String(data.viewer_count))
          .setThumbnail(data.thumbnail_url)
          .addField(
            language(`gaming/twitch:TWITCH_CHANNEL`),
            language(`gaming/twitch:HYPERLINK`, { url: `https://twitch.tv/${subscription.username}` })
          )
      }

      const guild = Gamer.guilds.get(sub.guildID)
      if (!guild) continue

      const channel = guild.channels.get(sub.channelID)
      if (!channel) continue

      const botPerms = channel.permissionsOf(Gamer.user.id)
      if (!botPerms.has('readMessages') || !botPerms.has('sendMessages') || !botPerms.has('embedLinks')) continue

      Gamer.createMessage(sub.channelID, { embed: embed.code })
    }
  }
}
