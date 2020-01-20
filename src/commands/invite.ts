import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`invite`, `join`], async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
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
