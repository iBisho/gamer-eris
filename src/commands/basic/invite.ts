import { Command } from 'yuuko'
import GamerEmbed from '../../lib/structures/GamerEmbed'
import GamerClient from '../../lib/structures/GamerClient'

const inviteGifs = [
  `https://i.gifer.com/9lCY.gif`,
  `https://media.giphy.com/media/OF0yOAufcWLfi/200.gif`,
  `https://media.giphy.com/media/10a9ikXNvR9MXe/giphy.gif`,
  `https://i.imgur.com/vMGRQIJ.gif`,
  `https://i.imgur.com/GBnKybX.gif`,
  `https://media.giphy.com/media/xT1R9YYeCajBym9Gfu/giphy.gif`,
  `https://media.giphy.com/media/1wrljsh9BGssuqB9Rl/giphy.gif`,
  `https://media.giphy.com/media/39itwE2U7Sn6J5OKTz/giphy.gif`,
  `https://media.giphy.com/media/x4d13vfU1aVfDuB7Lq/giphy.gif`,
  `https://media.giphy.com/media/3o6fJemsz0LuppaB9u/giphy.gif`,
  `https://media.giphy.com/media/9LZsdsfMFPaMmKxgx4/giphy.gif`,
  `https://media.giphy.com/media/3otPopJuagoFrYMWgo/giphy.gif`,
  `https://media.giphy.com/media/6aTYRMFYp0cHm/giphy.gif`,
  `https://media.giphy.com/media/ZvCwt9buHnGIU/giphy.gif`,
  `https://media.giphy.com/media/3o6nUPBoQnXnLj7XYQ/giphy.gif`,
  `https://media.giphy.com/media/20OE3mXibiDgmGv5Q0/giphy.gif`,
  `https://media.giphy.com/media/1ziU2CHQK9WfslLCA9/giphy.gif`,
  `https://media.giphy.com/media/13kFvLgANAfSqQ/giphy.gif`,
  `https://media.giphy.com/media/l41YouCUUcreUabHW/giphy.gif`,
  `https://media.giphy.com/media/1kHA0sFJISGplUeWMc/giphy.gif`,
  `https://media.giphy.com/media/l2SpQeWGHB9S8pXuo/giphy.gif`
]

export default new Command([`invite`, `join`], (message, _args, context) => {
  const language = (context.client as GamerClient).i18n.get('en-US')
  if (!language) return null

  const embed = new GamerEmbed()
    .setDescription(
      language('basic/invite:LINKS', {
        invite: `https://discordapp.com/oauth2/authorize?client_id=${context.client.user.id}&scope=bot&permissions=336067670`
      })
    )
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.defaultAvatarURL
    )
    .setImage(inviteGifs[Math.floor(Math.random() * inviteGifs.length)])

  return message.channel.createMessage({ embed: embed.code })
})
