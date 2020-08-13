import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'

const gifs = [
  'https://media1.tenor.com/images/33a468dc1c18433c7b2179cc09551e6b/tenor.gif',
  'https://media1.tenor.com/images/ab3ceecc5fd236edc48c0673d3ec5e07/tenor.gif',
  'https://media1.tenor.com/images/cfaed81d48574fe6e8155cfb82bcb939/tenor.gif',
  'https://media1.tenor.com/images/7fdcc0750a510f4c0e1e0f22c67f44eb/tenor.gif',
  'https://media1.tenor.com/images/4b4bdbf07ae2e3ad8309b78004989a5d/tenor.gif',
  'https://media1.tenor.com/images/8b3d0676fc41306f609de4e72f9c2e03/tenor.gif',
  'https://media1.tenor.com/images/43a482354ab244d0389b807f3cfd4dbe/tenor.gif',
  'https://media1.tenor.com/images/2267f0ce80742ed6be677c3124c1b137/tenor.gif',
  'https://media1.tenor.com/images/2860b1472546389ad0f28ba394aff77c/tenor.gif',
  'https://media1.tenor.com/images/859d8d48d7a2489be991d1f16445dd14/tenor.gif',
  'https://media1.tenor.com/images/e8597bdc08441ab29ea4ce3e8ef68194/tenor.gif',
  'https://media1.tenor.com/images/1377b64b722d2023610b81008695c507/tenor.gif'
]

export default new Command(`mavis`, (message, _args, context) => {
  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const randomNum = Math.floor(Math.random() * gifs.length)
  const randomGif = gifs[randomNum]
  if (!randomGif) return

  const embed = new MessageEmbed()
    .setAuthor(message.member?.nick || message.author.username, message.author.avatarURL)
    .setImage(randomGif)
    .setDescription(language(`fun/mavis:REPLY_NUMBER${randomNum}`))

  return message.channel.createMessage({ embed: embed.code })
})
