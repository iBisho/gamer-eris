import { Command } from 'yuuko'
import GamerEmbed from '../../../lib/structures/GamerEmbed'
import GamerClient from '../../../lib/structures/GamerClient'

const gifs = [
  `https://media.giphy.com/media/fQunZUcpE1EhVKSx6X/giphy.gif`,
  `https://media.giphy.com/media/1NVsXMbLvq7VE5smlK/giphy.gif`,
  `https://media.giphy.com/media/fBS6DmFIlMmzyoCqF2/giphy.gif`,
  `https://media.giphy.com/media/jVEGU4qGUog5E3R3LN/giphy.gif`,
  `https://media.giphy.com/media/1j8M0Wsf6jRX3VsmwO/giphy.gif`,
  `https://media.giphy.com/media/6yxmNi6O99KeACUMVb/giphy.gif`,
  `https://media.giphy.com/media/3HyZKhFslg969W5WXw/giphy.gif`,
  `https://media.giphy.com/media/xlMOtIkU1M4nGkRQYt/giphy.gif`,
  `https://media.giphy.com/media/p4jbkLr4jiPJAoaFX4/giphy.gif`,
  `https://media.giphy.com/media/1APg5I6sXkPZDP5QBf/giphy.gif`,
  `https://media.giphy.com/media/2hgwsPePlZTgsA7C3n/giphy.gif`,
  `https://media.giphy.com/media/9G1A7CobcRwgGp9vg9/giphy.gif`,
  `https://media.giphy.com/media/4Zm8aGdQdKXwg7NQlZ/giphy.gif`,
  `https://media.giphy.com/media/9VpBrxjrsnheCDZ2fy/giphy.gif`,
  `https://media.giphy.com/media/2vjOHVPssJJ1wpItFz/giphy.gif`,
  `https://media.giphy.com/media/BoX3BPp6j8uOOLGjXK/giphy.gif`,
  `https://media.giphy.com/media/21S73UCkrxJxWG3Dhg/giphy.gif`,
  `https://media.giphy.com/media/7OVRgYqT9GxUfXyaxc/giphy.gif`,
  `https://media.giphy.com/media/fxkgaP7CSKmuUKYU6N/giphy.gif`,
  `https://media.giphy.com/media/31QbHZ0MazpcQsiRt0/giphy.gif`,
  `https://media.giphy.com/media/cmxSypNsi2Bqyk6y7L/giphy.gif`,
  `https://media.giphy.com/media/ZxnrUuprQUjHFVkowl/giphy.gif`,
  `https://media.giphy.com/media/1mihFlTvBkNAHyZvBT/giphy.gif`,
  `https://media.giphy.com/media/69jDLdAZQrbupcNDKW/giphy.gif`,
  `https://media.giphy.com/media/pPnaAWlWfIwk4X61WD/giphy.gif`,
  `https://media.giphy.com/media/408A2mKD7TLVt4Pppa/giphy.gif`,
  `https://media.giphy.com/media/521XCRNzUXqEp4gcvw/giphy.gif`,
  `https://media.giphy.com/media/ygx0xTvuY6iLej0j1z/giphy.gif`,
  `https://media.giphy.com/media/1wnna7T6JBtpFJUUd6/giphy.gif`,
  `https://media.giphy.com/media/pcLLMT4ciT0SUzLFqn/giphy.gif`,
  `https://media.giphy.com/media/ccRMvuuEO15O6c5xD9/giphy.gif`,
  `https://media.giphy.com/media/42vj8mRt6xdgpeLOYW/giphy.gif`,
  `https://media.giphy.com/media/wJCPTEHqQKZWi4c7Ex/giphy.gif`,
  `https://media.giphy.com/media/3FQxcGBwyYiBlP1Hkq/giphy.gif`,
  `https://media.giphy.com/media/cduwbw03WFWiV08j3L/giphy.gif`,
  `https://media.giphy.com/media/3dlXYLi92LBZaucFnF/giphy.gif`,
  `https://media.giphy.com/media/XIDRj5wTaNzDLGIKAt/giphy.gif`,
  `https://media.giphy.com/media/4Nbe0RROMZMfKiFxg8/giphy.gif`
]

export default new Command(`cuddle`, (message, _args, context) => {
  const Gamer = context.client as GamerClient
  const language = Gamer.i18n.get('en-US')
  if (!language) return null

  const user = message.mentions.length ? message.mentions[0] : message.author

  const randomGif = gifs[Math.floor(Math.random() * (gifs.length - 1))]
  const embed = new GamerEmbed()
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.avatarURL
    )
    .setImage(randomGif)
    .setDescription(
      language(user.id === message.author.id ? `fun/cuddle:SELF` : `fun/cuddle:REPLY`, {
        mention: user.mention,
        author: message.author.mention
      })
    )

  return message.channel.createMessage({ embed: embed.code })
})
