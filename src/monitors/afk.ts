import Monitor from '../lib/structures/Monitor'
import { Message, PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { UserSettings, GuildSettings } from '../lib/types/settings'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { GamerEmoji } from '../lib/types/gamer'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    if (message.channel instanceof PrivateChannel) return
    const authorSettings = (await Gamer.database.models.user.findOne({ id: message.author.id })) as UserSettings | null
    if (authorSettings && authorSettings.afk.enabled) {
      // If this user had the afk enabled, disable it now that they are back since they sent a message
      authorSettings.afk.enabled = false
      authorSettings.save()
    }
    // If no @ return
    if (!message.mentions.length) return

    const emojis = (await Gamer.database.models.emoji.find().catch(err => {
      Gamer.emit(`error`, err)
      return []
    })) as GamerEmoji[]

    const settings = (await Gamer.database.models.guild.findOne({
      id: message.channel.guild.id
    })) as GuildSettings | null
    if (!settings) return

    const language = Gamer.i18n.get(settings ? settings.language : 'en-US')
    if (!language) return

    const REASON = language(`settings/afk:REASON`)

    // Loop for each mention in the message
    for (const user of message.mentions) {
      const userSettings = (await Gamer.database.models.user.findOne({ id: user.id })) as UserSettings | null
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
