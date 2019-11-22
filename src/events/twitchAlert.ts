import Event from '../lib/structures/Event'
import { GamerSubscription } from '../database/schemas/subscription'
import Gamer from '..'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default class extends Event {
  async execute(subscription: GamerSubscription, data: TwitchStream) {
    for (const sub of subscription.subs) {
      const language = Gamer.i18n.get(Gamer.guildLanguages.get(sub.guildID) || `en-US`)
      if (!language) continue

      const embed = new GamerEmbed()
        .setAuthor(subscription.username, data.thumbnail_url)
        .setThumbnail(data.thumbnail_url)
        .addField(language(`gaming/twitch:VIEWS`), data.views)
        .addField(language(`gaming/twitch:TWITCH_CHANNEL`), language(`gaming/twitch:HYPERLINK`, { url: data.url }))
        .setTimestamp()

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
