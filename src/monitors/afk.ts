import Monitor from '../lib/structures/Monitor'
import { Message } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { MessageEmbed, userTag } from 'helperis'
import { deleteMessage } from '../lib/utils/eris'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    if (!message.guildID || !message.member) return

    const authorSettings = await Gamer.database.models.user.findOne({ userID: message.author.id })
    if (authorSettings?.afkEnabled) {
      // If this user had the afk enabled, disable it now that they are back since they sent a message
      authorSettings.afkEnabled = false
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
      if (!userSettings || !userSettings?.afkEnabled) continue

      // If the message saved is not an embed send it as an embed
      if (!userSettings?.afkMessage.startsWith(`{`)) {
        const embed = new MessageEmbed()
          .setAuthor(message.author.username, message.author.avatarURL)
          .setTitle(`${userTag(user)} is AFK:`)
          .setDescription(userSettings?.afkMessage)
          .setFooter(`${userTag(user)} AFK Message`)

        const response = await message.channel.createMessage({ embed: embed.code })
        deleteMessage(response, 10, REASON)
        continue
      }

      const json = JSON.parse(userSettings?.afkMessage)
      // Override the title and footer to prevent abuse and users getting scared the bot is posting random things
      json.title = `${userTag(user)} is AFK:`
      const footerText = `${userTag(user)} AFK Message`
      if (json.footer) json.footer.text = footerText
      else json.footer = { text: footerText }

      // Send the AFK message
      const response = await message.channel.createMessage({ embed: json })
      deleteMessage(response, 10, REASON)
    }
  }
}
