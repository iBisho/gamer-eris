import { Command } from 'yuuko'
import fetch from 'node-fetch'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { TenorGif } from '../lib/types/tenor'
import { PrivateChannel } from 'eris'

export default new Command(`gif`, async (message, args) => {
  if (message.channel instanceof PrivateChannel || !message.member) return
  if (!message.channel.nsfw) return

  const data: TenorGif | null = await fetch(`https://api.tenor.com/v1/search?q=${args[0]}&key=LIVDSRZULELA&limit=50`)
    .then(res => res.json())
    .catch(() => null)

  if (!data || !data.results.length) return
  const randomResult = data.results[Math.floor(Math.random() * (data.results.length - 1))]
  const [media] = randomResult.media

  const embed = new GamerEmbed()
    .setAuthor(message.member.nick || message.member.username, message.author.avatarURL)
    .setImage(media.gif.url)
    .setFooter(`Via Tenor`)

  return message.channel.createMessage({ embed: embed.code })
})
