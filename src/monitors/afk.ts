import Monitor from '../lib/structures/Monitor'
import { Message } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    if (!message.guildID || !message.member) return

    const authorSettings = await Gamer.database.models.user.findOne({ userID: message.author.id })
    if (authorSettings?.afk?.enabled) {
      // If this user had the afk enabled, disable it now that they are back since they sent a message
      authorSettings.afk.enabled = false
      authorSettings.save()
    }
    // If no @ return
    if (!message.mentions.length) return

    const hasPermission = Gamer.helpers.discord.checkPermissions(message.channel, Gamer.user.id, [
      'readMessages',
      'sendMessages',
      'embedLinks'
    ])
    if (!hasPermission) return

    const language = Gamer.getLanguage(message.guildID)
    const REASON = language(`settings/afk:REASON`)

    // Loop for each mention in the message
    for (const user of message.mentions) {
      const userSettings = await Gamer.database.models.user.findOne({ userID: user.id })
      // If the afk is disabled
      if (!userSettings || !userSettings?.afk?.enabled) continue

      // If the message saved is not an embed send it as an embed
      if (!userSettings?.afk?.message.startsWith(`{`)) {
        const embed = new MessageEmbed()
          .setAuthor(message.author.username, message.author.avatarURL)
          .setTitle(`${user.username}${user.discriminator} is AFK:`)
          .setDescription(userSettings?.afk?.message)
          .setFooter(`${user.username}${user.discriminator} AFK Message`)

        const response = await message.channel.createMessage({ embed: embed.code })
        setTimeout(() => response.delete(REASON), 10000)
        continue
      }

      const json = JSON.parse(userSettings?.afk?.message)
      // Override the title and footer to prevent abuse and users getting scared the bot is posting random things
      json.title = `${user.username}${user.discriminator} is AFK:`
      json.footer.text = `${user.username}${user.discriminator} AFK Message`

      // Send the AFK message
      const response = await message.channel.createMessage({ embed: json })
      setTimeout(() => response.delete(REASON), 10000)
    }
  }
}
