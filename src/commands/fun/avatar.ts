import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`avatar`, `pfp`, `userimage`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const [userID] = args
  const user =
    message.mentions[0] || (userID ? (await Gamer.helpers.discord.fetchUser(userID)) || message.author : message.author)

  const imageURL = user.dynamicAvatarURL(undefined, 2048)

  const embed = new MessageEmbed()
    .setAuthor(message.member?.nick || message.author.username, message.author.avatarURL)
    .setDescription(language(`fun/avatar:DOWNLOAD`, { url: imageURL }))
    .setImage(imageURL)

  message.channel.createMessage({ embed: embed.code })
  if (message.member) Gamer.helpers.levels.completeMission(message.member, `avatar`, message.guildID)
})
