import GamerClient from '../structures/GamerClient'
import { Message } from 'eris'
import GamerEmbed from '../structures/GamerEmbed'
import { TenorGif } from '../types/tenor'
import fetch from 'node-fetch'

export default class {
  Gamer: GamerClient
  constructor(client: GamerClient) {
    this.Gamer = client
  }
  // Can be used to make the bot sleep
  async randomGif(message: Message, commandName: string, whitelistedGifs: string[], needDescription = true) {
    if (!message.guildID) return

    const language = this.Gamer.getLanguage(message.guildID)

    const user = message.mentions.length ? message.mentions[0] : message.author

    const embed = new GamerEmbed().setAuthor(message.member?.nick || message.author.username, message.author.avatarURL)

    // Some commands don't have these responses so we keep it out
    if (needDescription)
      embed.setDescription(
        language(user.id === message.author.id ? `fun/${commandName}:SELF` : `fun/${commandName}:REPLY`, {
          mention: user.mention,
          author: message.author.mention
        })
      )

    if (this.Gamer.guildsDisableTenor.has(message.guildID)) {
      embed
        .setImage(this.Gamer.helpers.utils.chooseRandom(whitelistedGifs))
        .setFooter(language(`common:WHITELISTED_TENOR`))
    } else {
      const data: TenorGif | undefined = await fetch(
        `https://api.tenor.com/v1/search?q=${commandName}&key=LIVDSRZULELA&limit=50`
      )
        .then(res => res.json())
        .catch(() => undefined)

      if (!data || !data.results.length) return message.channel.createMessage(language(`fun/advice:ERROR`))
      const randomResult = this.Gamer.helpers.utils.chooseRandom(data.results)
      const [media] = randomResult.media

      embed.setImage(media.gif.url).setFooter(language(`common:TENOR`))
    }

    message.channel.createMessage({ embed: embed.code })

    return message.member
      ? this.Gamer.helpers.levels.completeMission(message.member, commandName, message.guildID)
      : undefined
  }
}
