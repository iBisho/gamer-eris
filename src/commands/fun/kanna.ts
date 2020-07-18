import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'

const gifs = [
  'https://media.giphy.com/media/NRVCgNCn52SAg/source.gif',
  'https://media.giphy.com/media/Q2DabV4eRh160/source.gif',
  'https://media.giphy.com/media/5tmRHwTlHAA9WkVxTU/source.gif',
  'https://media.giphy.com/media/3o7bugDTSonKTqVd3q/source.gif',
  'https://media.giphy.com/media/l0IyjCRcRa6pQo2S4/source.gif',
  'https://media1.tenor.com/images/5f08ccadfab581517f073245adb5f68c/tenor.gif',
  'https://media1.tenor.com/images/c00ff77b181a298ad1cbcee2977283e8/tenor.gif',
  'https://media1.tenor.com/images/c57dc8b5dabf5ab3b884e3f06d37e40a/tenor.gif',
  'https://media1.tenor.com/images/592fc38722fc9fe4a98d88a71569e9c8/tenor.gif',
  'https://media1.tenor.com/images/a929ddcf3bc22542396904cea55addbf/tenor.gif',
  'https://media1.tenor.com/images/32a19f23477c9ddcc447a0c0479528f4/tenor.gif',
  'https://media1.tenor.com/images/72268391ffde3cd976a456ee2a033f46/tenor.gif'
]

export default new Command(`kanna`, (message, _args, context) => {
  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const randomNum = Math.floor(Math.random() * gifs.length)
  const randomGif = gifs[randomNum]
  if (!randomGif) return

  const kannaReply = `fun/kanna:REPLY_NUMBER${randomNum}`

  const embed = new MessageEmbed()
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.avatarURL
    )
    .setImage(randomGif)
    .setDescription(language(kannaReply))

  return message.channel.createMessage({ embed: embed.code })
})
