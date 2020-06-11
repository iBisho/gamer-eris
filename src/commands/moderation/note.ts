import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`note`], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!botMember) return

  const language = Gamer.getLanguage(message.guildID)
  if (!args.length) return message.channel.createMessage(language(`moderation/note:NEED_USER`))

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return

  let [userID] = args
  args.shift()
  if (userID.startsWith('<@!')) userID = userID.substring(3, userID.length - 1)
  else if (userID.startsWith('<@')) userID = userID.substring(2, userID.length - 1)

  const user = (await Gamer.helpers.discord.fetchUser(Gamer, userID)) || message.mentions[0]
  if (!user) return message.channel.createMessage(language(`moderation/note:NEED_USER`))

  const reason = args.join(` `)
  if (!reason) return message.channel.createMessage(language(`moderation/note:NEED_REASON`))

  const member = await Gamer.helpers.discord.fetchMember(message.member.guild, user.id)
  if (!member) return

  // Checks if the bot is higher than the user
  if (!Gamer.helpers.discord.compareMemberPosition(botMember, member))
    return message.channel.createMessage(language(`moderation/note:BOT_TOO_LOW`))
  // Checks if the mod is higher than the user
  if (!Gamer.helpers.discord.compareMemberPosition(message.member, member))
    return message.channel.createMessage(language(`moderation/note:USER_TOO_LOW`))

  const modlogID = await Gamer.helpers.moderation.createModlog(message, guildSettings, language, user, `note`, reason)

  // Response that will get sent in the channel
  const response = new MessageEmbed()
    .setAuthor(language(`moderation/note:MODERATOR`, { mod: message.author.username }), message.author.avatarURL)
    .addField(
      language(`moderation/modlog:MEMBER`),
      language(`moderation/note:MEMBER_INFO`, { member: member?.mention, user: member.username, id: member.id })
    )
    .addField(language(`common:REASON`), reason)
    .setThumbnail(user.avatarURL)
    .setTimestamp()
    .setFooter(language(`moderation/modlog:CASE`, { id: modlogID }))

  return message.channel.createMessage({ embed: response.code })
})
