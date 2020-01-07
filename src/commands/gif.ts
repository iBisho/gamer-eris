import { Command } from 'yuuko'
import fetch from 'node-fetch'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { TenorGif } from '../lib/types/tenor'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`gif`, async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return
  if (!message.channel.nsfw) return
  const Gamer = context.client as GamerClient

  const data: TenorGif | null = await fetch(`https://api.tenor.com/v1/search?q=${args[0]}&key=LIVDSRZULELA&limit=50`)
    .then(res => res.json())
    .catch(() => null)

  if (!data || !data.results.length) return
  const randomResult = Gamer.helpers.utils.chooseRandom(data.results)
  const [media] = randomResult.media

  const embed = new GamerEmbed()
    .setAuthor(message.member.nick || message.member.username, message.author.avatarURL)
    .setImage(media.gif.url)
    .setFooter(`Via Tenor`)

  return message.channel.createMessage({ embed: embed.code })
})
