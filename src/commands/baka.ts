import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import fetch from 'node-fetch'
import { TenorGif } from '../lib/types/tenor'

export default new Command(`baka`, async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || !message.member) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const user = message.mentions.length ? message.mentions[0] : message.author

  const data: TenorGif | undefined = await fetch(`https://api.tenor.com/v1/search?q=baka&key=LIVDSRZULELA&limit=50`)
    .then(res => res.json())
    .catch(() => undefined)

  if (!data || !data.results.length) return message.channel.createMessage(language(`fun/advice:ERROR`))
  const randomResult = data.results[Math.floor(Math.random() * (data.results.length - 1))]
  const [media] = randomResult.media

  const embed = new GamerEmbed()
    .setAuthor(message.member?.nick || message.author.username, message.author.avatarURL)
    .setImage(media.gif.url)
    .setDescription(
      language(user.id === message.author.id ? `fun/baka:SELF` : `fun/baka:REPLY`, {
        mention: user.mention,
        author: message.author.mention
      })
    )
    .setFooter(`Via Tenor`)

  message.channel.createMessage({ embed: embed.code })
  return Gamer.helpers.levels.completeMission(message.member, `baka`, message.channel.guild.id)
})
