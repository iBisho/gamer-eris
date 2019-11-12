import { Command } from 'yuuko'
import fetch from 'node-fetch'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { TenorGif } from '../lib/types/tenor'

export default new Command(`gif`, async (message, _args, context) => {
  if (!message.channel.nsfw) return
  const language = (context.client as GamerClient).i18n.get('en-US')
  if (!language) return null

  const data: TenorGif | null = await fetch(`https://api.tenor.com/v1/search?q=${args[0]}&key=LIVDSRZULELA&limit=50`)
    .then(res => res.json())
    .catch(() => null)

  if (!data || !data.results.length) return message.channel.createMessage(language(`fun/advice:ERROR`))
  const randomResult = data.results[Math.floor(Math.random() * (data.results.length - 1))]
  const [media] = randomResult.media

  const embed = new GamerEmbed()
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.avatarURL
    )
    .setImage(media.gif.url)
    .setFooter(`Via Tenor`)

  return message.channel.createMessage({ embed: embed.code })
})
