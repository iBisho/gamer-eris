import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'

const responses = [
  'Totally!',
  'Yes!',
  'Definitely!',
  'Probably.',
  'Very likely.',
  'Likely.',
  'Unlikely.',
  "I wouldn't count on it.",
  'No!',
  'Definitely not!',
  'Nope!',
  'No way!'
]

export default new Command(`8ball`, (message, _args, context) => {
  const Gamer = context.client as GamerClient
  const language = Gamer.i18n.get('en-US')
  if (!language) return null

  const randomNum = Math.floor(Math.random() * responses.length)
  const response = responses[randomNum]

  const embed = new GamerEmbed()
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.avatarURL
    )
    .setDescription(response)

  return message.channel.createMessage({ embed: embed.code })
})
