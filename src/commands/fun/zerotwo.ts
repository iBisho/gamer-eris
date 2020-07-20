import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'

const gifs = [
  'https://media1.tenor.com/images/66c62275b955663f02e2e3567468c9f2/tenor.gif',
  'https://media1.tenor.com/images/c5e6ccfc7e09ebe3c4f544b7c2171141/tenor.gif',
  'https://media1.tenor.com/images/4cd7e1d1e6ac165b333d35b1d15a20b8/tenor.gif',
  'https://media1.tenor.com/images/e33bddfe91ceb3be4ce63cb0c155a148/tenor.gif',
  'https://media1.tenor.com/images/80b7bffdd03c927b27fcb47935484ef4/tenor.gif',
  'https://media1.tenor.com/images/f31b70a251331227ea361d6bf1171306/tenor.gif',
  'https://media1.tenor.com/images/4eeb62df486276cac3a5605812e97234/tenor.gif',
  'https://media1.tenor.com/images/7ad11368b6928becf9a17c19efb1adcc/tenor.gif',
  'https://media1.tenor.com/images/1eb11323b9b05ad12af576f2366a76b4/tenor.gif',
  'https://media1.tenor.com/images/1fc78a6aa77a9ca713be1eb6c7b40043/tenor.gif',
  'https://media1.tenor.com/images/1ad4605cc881a6f5e23e47e7d7ce4220/tenor.gif'
]

export default new Command(`zerotwo`, (message, _args, context) => {
  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const randomNum = Math.floor(Math.random() * gifs.length)
  const randomGif = gifs[randomNum]
  if (!randomGif) return

  const embed = new MessageEmbed()
    .setAuthor(message.member?.nick || message.author.username, message.author.avatarURL)
    .setImage(randomGif)
    .setDescription(language(`fun/zerotwo:REPLY_NUMBER${randomNum}`))

  return message.channel.createMessage({ embed: embed.code })
})
