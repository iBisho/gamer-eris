import { Command } from 'yuuko'
import GamerEmbed from '../../../lib/structures/GamerEmbed'
import GamerClient from '../../../lib/structures/GamerClient'

const gifs = [
  `https://media.giphy.com/media/ThndUIbw1Znbi/giphy.gif`,
  `https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif`,
  `https://media.giphy.com/media/oF3bOtVhGe2Oc/giphy.gif`,
  `https://media.giphy.com/media/u49M6htQoy33iIJRYy/giphy.gif`,
  `https://media.giphy.com/media/ZwDFhUpZmpiHsSdE9r/giphy.gif`,
  `https://media.giphy.com/media/cJp1XwEl0lQjqxm1ks/giphy.gif`,
  `https://media.giphy.com/media/ZOiGxXvsp7fUW9qEKo/giphy.gif`,
  `https://media.giphy.com/media/31ZmRUPRouh8j4i7lJ/giphy.gif`,
  `https://media.giphy.com/media/2yrXpF2Ztea6npIK5T/giphy.gif`,
  `https://media.giphy.com/media/4KEM9skIZny5Embk6m/giphy.gif`,
  `https://media.giphy.com/media/5UBoxuaPMoeaFbL0gt/giphy.gif`,
  `https://media.giphy.com/media/8OVl1kpAJsDq7qU4mB/giphy.gif`,
  `https://media.giphy.com/media/PMiD3L5eDc5Zk654oE/giphy.gif`,
  `https://media.giphy.com/media/1zKw9miASAdGHVoXvY/giphy.gif`,
  `https://media.giphy.com/media/pz8l8gqYOfr57QspN3/giphy.gif`,
  `https://media.giphy.com/media/9Vgnkoz9tfUA4O2LtZ/giphy.gif`,
  `https://media.giphy.com/media/ILAhGxCfEtPIYltlr1/giphy.gif`,
  `https://media.giphy.com/media/5htJUTlgr0tDxRp2lN/giphy.gif`,
  `https://media.giphy.com/media/vvyqec4Mny2abrei7u/giphy.gif`,
  `https://media.giphy.com/media/cRNfQTYGOOgnzSQaID/giphy.gif`,
  `https://media.giphy.com/media/c6VwIsJyB39xEFY1mG/giphy.gif`,
  `https://media.giphy.com/media/69o9tRD9ekEGa248wv/giphy.gif`,
  `https://media.giphy.com/media/WgSHxJZteOcrj5MpPy/giphy.gif`,
  `https://media.giphy.com/media/kFVty9E06cVpPiriF2/giphy.gif`,
  `https://media.giphy.com/media/8FS57KlNKdFZJlhKPx/giphy.gif`,
  `https://media.giphy.com/media/9rnERPUhPGKzDzl9IQ/giphy.gif`,
  `https://media.giphy.com/media/4YXVFDGiIlCIutQmns/giphy.gif`,
  `https://media.giphy.com/media/4NrzFC9M4Ueo3mj2DE/giphy.gif`
]

export default new Command(`baka`, (message, _args, context) => {
  const Gamer = context.client as GamerClient
  const language = Gamer.i18n.get('en-US')
  if (!language) return null

  const user = message.mentions.length ? message.mentions[0] : message.author

  const randomGif = gifs[Math.floor(Math.random() * (gifs.length - 1))]
  const embed = new GamerEmbed()
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.defaultAvatarURL
    )
    .setImage(randomGif)
    .setDescription(
      language(user.id === message.author.id ? `fun/baka:SELF` : `fun/baka:REPLY`, {
        mention: user.mention,
        author: message.author.mention
      })
    )

  return message.channel.createMessage({ embed: embed.code })
})
