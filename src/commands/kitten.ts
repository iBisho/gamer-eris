import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'
import fetch from 'node-fetch'
import { PrivateChannel, GroupChannel } from 'eris'

const gifs = [
  `https://media2.giphy.com/media/Fivx313yEXbhe/giphy.gif?cid=790b76115cd6f0365067477932b8699c&rid=giphy.gif`,
  `https://media0.giphy.com/media/l2ahacDwOHDAtuoHsy/giphy.gif?cid=790b76115cd6f0074c6b614a4956759f&rid=giphy.gif`,
  `https://media.giphy.com/media/btjkkkawtefIY/giphy.gif`,
  `https://media.giphy.com/media/DqSReZdWmjS7K/giphy.gif`,
  `https://media.giphy.com/media/MWSRkVoNaC30A/giphy.gif`,
  `https://media.giphy.com/media/l6Td5sKDNmDGU/giphy.gif`,
  `https://media.giphy.com/media/KhdQ2Ia3FJuKs/giphy.gif`,
  `https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif`,
  `https://media.giphy.com/media/2uIkZyLx04rVGS55gt/giphy.gif`,
  `https://media.giphy.com/media/10dU7AN7xsi1I4/giphy.gif`,
  `https://media.giphy.com/media/k1d4zyVkGu36g/giphy.gif`,
  `https://media.giphy.com/media/31VLLE5CqYnrg5SBAL/giphy.gif`,
  `https://media.giphy.com/media/CNprQ8KGpORVu/giphy.gif`,
  `https://media.giphy.com/media/k3ubYqStnQ3y8/giphy.gif`,
  `https://media.giphy.com/media/RQgzLsPYlzrBC/giphy.gif`,
  `https://media.giphy.com/media/ocGGCX3B84iA/giphy.gif`,
  `https://media.giphy.com/media/11byAhpyVgml20/giphy.gif`,
  `https://media.giphy.com/media/12bjQ7uASAaCKk/giphy.gif`,
  `https://media.giphy.com/media/njtPBlbYnHAHK/giphy.gif`,
  `https://media.giphy.com/media/3Ev8JMnsNqUM/giphy.gif`,
  `https://media.giphy.com/media/8BKRfgnUt0KvS/giphy.gif`,
  `https://media.giphy.com/media/OmK8lulOMQ9XO/giphy.gif`,
  `https://media.giphy.com/media/Fc1QWasqMDJAc/giphy.gif`,
  `https://media.giphy.com/media/11kXFNRcZBFgwo/giphy.gif`,
  `https://media.giphy.com/media/4Iw2OzgiiTc4M/giphy.gif`,
  `https://media.giphy.com/media/1wnZSnmrnwJmnJkd1c/giphy.gif`,
  `https://media.giphy.com/media/14kjO9NxIuEF20/giphy.gif`,
  `https://media.giphy.com/media/FP2OpdSFCR7hK/giphy.gif`,
  `https://media.giphy.com/media/LMn7PRCVDcnvO/giphy.gif`,
  `https://media.giphy.com/media/2z0OViv5TdAGs/giphy.gif`
]

export default new Command([`kitten`, `cat`], async (message, _args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return
  // Fetching a random fact
  const data: Kitten | null = await fetch(`https://catfact.ninja/fact`)
    .then(res => res.json())
    .catch(() => null)

  // Randomising the gifs
  const randomGif = gifs[Math.floor(Math.random() * (gifs.length - 1))]

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.channel.guild.id)

  const embed = new GamerEmbed()
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.avatarURL
    )
    .setDescription(data ? language(`fun/kitten:FACT`, { fact: data.fact }) : '')
    .setImage(randomGif)

  return message.channel.createMessage({ embed: embed.code })
})

export interface Kitten {
  fact: string
  length: number
}
