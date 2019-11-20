import { Command } from 'yuuko'
import fetch from 'node-fetch'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { TenorGif } from '../lib/types/tenor'
import { PrivateChannel } from 'eris'

export default new Command(`kiss`, async (message, _args, context) => {
  if (message.channel instanceof PrivateChannel) return

  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const data: TenorGif | undefined = await fetch(`https://api.tenor.com/v1/search?q=kiss&key=LIVDSRZULELA&limit=50`)
    .then(res => res.json())
    .catch(() => undefined)

  if (!data || !data.results.length) return message.channel.createMessage(language(`fun/advice:ERROR`))
  const randomResult = data.results[Math.floor(Math.random() * (data.results.length - 1))]
  const [media] = randomResult.media

  const user = message.mentions.length ? message.mentions[0] : message.author

  const embed = new GamerEmbed()
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.avatarURL
    )
    .setDescription(
      language(user.id === message.author.id ? `fun/kiss:SELF` : `fun/kiss:REPLY`, {
        mention: user.mention,
        author: message.author.mention
      })
    )
    .setImage(media.gif.url)
    .setFooter(`Via Tenor`)

  return message.channel.createMessage({ embed: embed.code })
})
