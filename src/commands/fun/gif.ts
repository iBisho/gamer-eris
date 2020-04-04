import { Command } from 'yuuko'
import fetch from 'node-fetch'
import { MessageEmbed } from 'helperis'
import { TenorGif } from '../../lib/types/tenor'
import GamerClient from '../../lib/structures/GamerClient'
import { GuildTextableChannel } from 'eris'

export default new Command(`gif`, async (message, args, context) => {
  if (!message.guildID) return

  if (!(message.channel as GuildTextableChannel).nsfw) return
  const Gamer = context.client as GamerClient

  const data: TenorGif | undefined = await fetch(
    `https://api.tenor.com/v1/search?q=${args[0]}&key=LIVDSRZULELA&limit=50`
  )
    .then(res => res.json())
    .catch(() => undefined)

  if (!data || !data.results.length) return
  const randomResult = Gamer.helpers.utils.chooseRandom(data.results)
  const [media] = randomResult.media

  const embed = new MessageEmbed()
    .setAuthor(message.member?.nick || message.author.username, message.author.avatarURL)
    .setImage(media.gif.url)
    .setFooter(`Via Tenor`)

  return message.channel.createMessage({ embed: embed.code })
})
