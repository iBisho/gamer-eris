import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'
import fetch from 'node-fetch'
import { TenorGif } from '../lib/types/tenor'
import constants from '../constants'

export default new Command(`cuddle`, async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const language = Gamer.getLanguage(message.channel.guild.id)

  const user = message.mentions.length ? message.mentions[0] : message.author

  const embed = new GamerEmbed()
    .setAuthor(message.member?.nick || message.author.username, message.author.avatarURL)
    .setDescription(
      language(user.id === message.author.id ? `fun/cuddle:SELF` : `fun/cuddle:REPLY`, {
        mention: user.mention,
        author: message.author.mention
      })
    )

  if (Gamer.guildsDisableTenor.has(message.channel.guild.id)) {
    embed
      .setImage(Gamer.helpers.utils.chooseRandom(constants.gifs.cuddle))
      .setFooter(language(`common:WHITELISTED_TENOR`))
  } else {
    const data: TenorGif | undefined = await fetch(`https://api.tenor.com/v1/search?q=cuddle&key=LIVDSRZULELA&limit=50`)
      .then(res => res.json())
      .catch(() => undefined)

    if (!data || !data.results.length) return message.channel.createMessage(language(`fun/advice:ERROR`))
    const randomResult = Gamer.helpers.utils.chooseRandom(data.results)
    const [media] = randomResult.media

    embed.setImage(media.gif.url).setFooter(language(`common:TENOR`))
  }

  message.channel.createMessage({ embed: embed.code })
  return Gamer.helpers.levels.completeMission(message.member, `cuddle`, message.channel.guild.id)
})
