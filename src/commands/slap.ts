import { Command } from 'yuuko'
import fetch from 'node-fetch'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { TenorGif } from '../lib/types/tenor'

export default new Command(`slap`, async (message, _args, context) => {
  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get('en-US')
  if (!language) return null

  const data: TenorGif | null = await fetch(`https://api.tenor.com/v1/search?q=slap&key=LIVDSRZULELA&limit=50`)
    .then(res => res.json())
    .catch(() => null)

  if (!data || !data.results.length) return message.channel.createMessage(language(`fun/advice:ERROR`))
  const randomResult = Gamer.helpers.utils.chooseRandom(data.results)
  const [media] = randomResult.media

  const user = message.mentions.length ? message.mentions[0] : message.author

  const embed = new GamerEmbed()
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.avatarURL
    )
    .setDescription(
      language(user.id === message.author.id ? `fun/slap:SELF` : `fun/slap:REPLY`, {
        mention: user.mention,
        author: message.author.mention
      })
    )
    .setImage(media.gif.url)
    .setFooter(`Via Tenor`)

  return message.channel.createMessage({ embed: embed.code })
})
