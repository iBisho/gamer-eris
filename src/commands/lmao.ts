import { Command } from 'yuuko'
import fetch from 'node-fetch'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { TenorGif } from '../lib/types/tenor'
import constants from '../constants'

export default new Command([`lmao`, `lol`], async (message, _args, context) => {
  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get('en-US')
  if (!language) return null

  const data: TenorGif | null = await fetch(`https://api.tenor.com/v1/search?q=lmao&key=LIVDSRZULELA&limit=50`)
    .then(res => res.json())
    .catch(() => null)

  if (!data || !data.results.length) return message.channel.createMessage(language(`fun/advice:ERROR`))
  const randomResult = Gamer.helpers.utils.chooseRandom(
    data.results.filter(res => !constants.general.dirtyTenorGifs.includes(res.media[0].gif.url))
  )
  const [media] = randomResult.media

  const user = message.mentions.length ? message.mentions[0] : message.author

  const embed = new GamerEmbed()
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.avatarURL
    )
    .setDescription(
      language(user.id === message.author.id ? `fun/lmao:SELF` : `fun/lmao:REPLY`, {
        mention: user.mention,
        author: message.author.mention
      })
    )
    .setImage(media.gif.url)
    .setFooter(`Via Tenor`)

  return message.channel.createMessage({ embed: embed.code })
})
