import Event from '../lib/structures/Event'
import Gamer from '..'
import { MessageEmbed } from 'helperis'
import { GamerManga } from '../database/schemas/manga'
import { MangaAlertData } from '../services/manga'

export default class extends Event {
  async execute(subscription: GamerManga, title: string, image: string, data: MangaAlertData[]) {
    const payload = data.map(d => `**[${d.text}](${d.url})**`).join('\n')

    const embed = new MessageEmbed()
      .setTitle(title)
      .setDescription(payload)
      .setImage(image)
      .setTimestamp()

    if (subscription.lastAlertData === payload) return
    subscription.lastAlertData = payload
    subscription.save()

    subscription.subs.forEach(sub => {
      // Get the guild specific language
      const language = Gamer.getLanguage(sub.guildID)
      if (!language) return

      const guild = Gamer.guilds.get(sub.guildID)
      if (!guild) return

      Gamer.helpers.logger.green(`Sending Manga Alert for ${title} to ${guild.name}`)
      const channel = guild.channels.get(sub.channelID)
      if (!channel) return

      const botPerms = channel.permissionsOf(Gamer.user.id)
      if (!botPerms.has('readMessages') || !botPerms.has('sendMessages') || !botPerms.has('embedLinks')) return

      Gamer.createMessage(sub.channelID, {
        content: "A new chapter is out! Hop in a voice channel and let's read it together",
        embed: embed.code
      })
    })
  }
}
