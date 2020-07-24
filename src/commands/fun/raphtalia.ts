import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'

const gifs = [
  'https://media1.tenor.com/images/f3ba711abc2538e7d48b1fada3d3a8c3/tenor.gif',
  'https://media1.tenor.com/images/c0e1b46577b048c4115e9e8d054f3b27/tenor.gif',
  'https://media1.tenor.com/images/71c5f8389fdd7af93ff3e8777c9b5390/tenor.gif',
  'https://media1.tenor.com/images/77f55584f081652d41de38dd3ae81abd/tenor.gif',
  'https://media1.tenor.com/images/01b43f936ed5c6218ef350462849b238/tenor.gif',
  'https://media1.tenor.com/images/186fb02a2164f37bc48b156e2f16f7ad/tenor.gif',
  'https://media1.tenor.com/images/f5558c996c5a4f0a97e5479992b284c9/tenor.gif',
  'https://media1.tenor.com/images/0444a1b1e7af31dde95dc67c44c18ce7/tenor.gif'
]

export default new Command(`raphtalia`, (message, _args, context) => {
  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const randomNum = Math.floor(Math.random() * gifs.length)
  const randomGif = gifs[randomNum]
  if (!randomGif) return

  const embed = new MessageEmbed()
    .setAuthor(message.member?.nick || message.author.username, message.author.avatarURL)
    .setImage(randomGif)
    .setDescription(language(`fun/raphtalia:REPLY_NUMBER${randomNum}`))

  return message.channel.createMessage({ embed: embed.code })
})
