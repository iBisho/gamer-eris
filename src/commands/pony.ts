import { Command } from 'yuuko'
import fetch from 'node-fetch'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { TenorGif } from '../lib/types/tenor'
import { PrivateChannel, GroupChannel } from 'eris'
import constants from '../constants'

export default new Command(`pony`, async (message, _args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const data: TenorGif | undefined = await fetch(`https://api.tenor.com/v1/search?q=pony&key=LIVDSRZULELA&limit=50`)
    .then(res => res.json())
    .catch(() => undefined)

  if (!data || !data.results.length) return message.channel.createMessage(language(`fun/advice:ERROR`))
  const randomResult = Gamer.helpers.utils.chooseRandom(
    data.results.filter(res => !constants.general.dirtyTenorGifs.includes(res.media[0].gif.url))
  )
  const [media] = randomResult.media

  const embed = new GamerEmbed()
    .setAuthor(message.member?.nick || message.author.username)
    .setDescription(
      language(`fun/pony:FACT`, { fact: language(`fun/pony:REPLY_NUMBER${Math.floor(Math.random() * 12)}`) })
    )
    .setImage(media.gif.url)
    .setFooter(`Via Tenor`)

  message.channel.createMessage({ embed: embed.code })

  return Gamer.helpers.levels.completeMission(message.member, `pony`, message.channel.guild.id)
})
