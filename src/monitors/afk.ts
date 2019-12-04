import Monitor from '../lib/structures/Monitor'
import { Message, PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

    const authorSettings = await Gamer.database.models.user.findOne({ userID: message.author.id })
    if (authorSettings && authorSettings.afk.enabled) {
      // If this user had the afk enabled, disable it now that they are back since they sent a message
      authorSettings.afk.enabled = false
      authorSettings.save()
    }
    // If no @ return
    if (!message.mentions.length) return

    const emojis = await Gamer.database.models.emoji.find()

    const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
    if (!language) return

    const REASON = language(`settings/afk:REASON`)

    // Loop for each mention in the message
    for (const user of message.mentions) {
      const userSettings = await Gamer.database.models.user.findOne({ userID: user.id })
      // If the afk is disabled
      if (!userSettings || !userSettings.afk.enabled) continue

      // If the message saved is not an embed send it as an embed
      if (!userSettings.afk.message.startsWith(`{`)) {
        const embed = new GamerEmbed()
          .setAuthor(message.author.username, message.author.avatarURL)
          .setTitle(`${user.username}${user.discriminator} is AFK:`)
          .setDescription(userSettings.afk.message)
          .setFooter(`${user.username}${user.discriminator} AFK Message`)

        message.channel.createMessage({ embed: embed.code }).then(msg => setTimeout(() => msg.delete(REASON), 10000))
        continue
      }

      const embed = Gamer.helpers.transform.variables(
        userSettings.afk.message,
        user,
        message.channel.guild,
        message.author,
        emojis
      )

      const json = JSON.parse(embed)
      // Override the title and footer to prevent abuse and users getting scared the bot is posting random things
      json.title = `${user.username}${user.discriminator} is AFK:`
      json.footer.text = `${user.username}${user.discriminator} AFK Message`

      // Send the AFK message
      message.channel
        .createMessage({ embed: JSON.parse(embed) })
        .then(msg => setTimeout(() => msg.delete(REASON), 10000))
    }
  }
}
