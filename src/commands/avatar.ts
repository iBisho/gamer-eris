import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default new Command([`avatar`, `pfp`, `userimage`], message => {
  const user = message.mentions.length ? message.mentions[0] : message.author

  const embed = new GamerEmbed()
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.avatarURL
    )
    .setImage(user.dynamicAvatarURL('webp', 2048))

  return message.channel.createMessage({ embed: embed.code })
})
