import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'

export default new Command([`invite`, `join`], async (message, _args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return
  const Gamer = context.client as GamerClient

  const language = Gamer.getLanguage(message.channel.guild.id)

  const embed = new GamerEmbed()
    .setDescription(
      language('basic/invite:LINKS', {
        invite: `https://discordapp.com/oauth2/authorize?client_id=${context.client.user.id}&scope=bot&permissions=336067670`
      })
    )
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.avatarURL
    )

  return message.channel.createMessage({ embed: embed.code })
})
