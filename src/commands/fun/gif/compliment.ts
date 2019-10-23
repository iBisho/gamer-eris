import { Command } from 'yuuko'
import GamerEmbed from '../../../lib/structures/GamerEmbed'
import GamerClient from '../../../lib/structures/GamerClient'

const gifs = [
  `https://media.giphy.com/media/MU3YUgsJONTzzIT9wd/giphy.gif`,
  `https://media.giphy.com/media/RtWy2QMqQnjqw/giphy.gif`,
  `https://media.giphy.com/media/3ofT5WD2ytLJxMi0c8/giphy.gif`,
  `https://media.giphy.com/media/xT8qB3gj6AxN7AsIta/giphy.gif`,
  `https://media.giphy.com/media/xUPGcDUNKnqM0BwNRm/giphy.gif`,
  `https://media.giphy.com/media/ely3apij36BJhoZ234/giphy.gif`,
  `https://media.giphy.com/media/26xBKJclSF8d57UWs/giphy.gif`,
  `https://media.giphy.com/media/LGr1RbE6sFiuY/giphy.gif`,
  `https://media.giphy.com/media/xT9IgrNBmDXi6Z0YoM/giphy.gif`,
  `https://media.giphy.com/media/3o7btSt2Et1GgIaDAY/giphy.gif`,
  `https://media.giphy.com/media/lMH90o7UMLBBK/giphy.gif`,
  `https://media.giphy.com/media/g46pNey9gyz4I/giphy.gif`,
  `https://media.giphy.com/media/3oriNTBCophI2Knwl2/giphy.gif`,
  `https://media.giphy.com/media/qZFiE4anMXAf6/giphy.gif`,
  `https://media.giphy.com/media/13dxO6zOV1PzBC/giphy.gif`,
  `https://media.giphy.com/media/xT9KVHhH6BzGXoVBcI/giphy.gif`,
  `https://media.giphy.com/media/3o6fJfz7ss4ophWwmc/giphy.gif`,
  `https://media.giphy.com/media/l1J9MA5SHf7pKh1TO/giphy.gif`,
  `https://media.giphy.com/media/7XAUg1U1d3gfDfFkHi/giphy.gif`,
  `https://media.giphy.com/media/4EEHLRBB6wsmUY5l1c/giphy.gif`,
  `https://media.giphy.com/media/9MeALGXrcZhDi/giphy.gif`,
  `https://media.giphy.com/media/FE06f8RXJWCTS/giphy.gif`,
  `https://media.giphy.com/media/51W2VcGolu0vxA07R6/giphy.gif`,
  `https://media.giphy.com/media/2vlL0BnjNRFZWyrc5A/giphy.gif`,
  `https://media.giphy.com/media/mD5S1OMeuCRdSRPNnv/giphy.gif`,
  `https://media.giphy.com/media/1eExotBWhtf6NtLzoy/giphy.gif`,
  `https://media.giphy.com/media/8F38jOB55n26lW4qcg/giphy.gif`,
  `https://media.giphy.com/media/fLsxPDdScBtoNu8FdS/giphy.gif`,
  `https://media.giphy.com/media/BpDOW8sQMYqnJApEy0/giphy.gif`,
  `https://media.giphy.com/media/N2UJ6q9sXKone/giphy.gif`,
  `https://media.giphy.com/media/26AHAw0aMmWwRI4Hm/giphy.gif`,
  `https://media.giphy.com/media/3og0IJwWcgKfhVda4o/giphy.gif`,
  `https://media.giphy.com/media/xT8qB3gj6AxN7AsIta/giphy.gif`,
  `https://media.giphy.com/media/tTA6WVVa4Zzri/giphy.gif`,
  `https://media.giphy.com/media/F3lPUjF1bb4go/giphy.gif`,
  `https://media.giphy.com/media/YVpIaYgJ3lpMk/giphy.gif`,
  `https://media.giphy.com/media/4Vtk42BGiL1T2/giphy.gif`
]

export default new Command([`compliment`, `comp`], (message, _args, context) => {
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
    .setDescription(language(`fun/compliment:REPLY`, { mention: user.mention, author: message.author.mention }))

  return message.channel.createMessage({ embed: embed.code })
})
