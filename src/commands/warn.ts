import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`warn`, `w`], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const botMember = message.member.guild.members.get(Gamer.user.id)
  if (!botMember) return

  const language = Gamer.getLanguage(message.guildID)

  if (!args.length) return message.channel.createMessage(language(`moderation/warn:NEED_USER`))

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings?.staff.modRoleIDs) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  let [userID] = args
  args.shift()
  if (userID.startsWith('<@!')) userID = userID.substring(3, userID.length - 1)
  else if (userID.startsWith('<@')) userID = userID.substring(2, userID.length - 1)

  const user = Gamer.users.get(userID) || message.mentions[0]
  if (!user) return message.channel.createMessage(language(`moderation/warn:NEED_USER`))

  const reason = args.join(` `)
  if (!reason) return message.channel.createMessage(language(`moderation/warn:NEED_REASON`))

  const member = message.member.guild.members.get(user.id)
  if (!member) return

  // Checks if the bot is higher than the user
  if (!Gamer.helpers.discord.compareMemberPosition(botMember, member))
    return message.channel.createMessage(language(`moderation/warn:BOT_TOO_LOW`))
  // Checks if the mod is higher than the user
  if (!Gamer.helpers.discord.compareMemberPosition(message.member, member))
    return message.channel.createMessage(language(`moderation/warn:USER_TOO_LOW`))

  const embed = new GamerEmbed()
    .setDescription(language(`moderation/warn:TITLE`, { guildName: message.member.guild.name, user: user.username }))
    .setThumbnail(user.avatarURL)
    .setTimestamp()
    .addField(language(`common:REASON`), reason)

  // Send the user a message. AWAIT to make sure message is sent before they are banned and lose access
  const dmChannel = await user.getDMChannel().catch(() => undefined)
  if (dmChannel) dmChannel.createMessage({ embed: embed.code }).catch(() => undefined)

  const modlogID = await Gamer.helpers.moderation.createModlog(message, guildSettings, language, user, `warn`, reason)

  // Response that will get sent in the channel
  const response = new GamerEmbed()
    .setAuthor(language(`moderation/warn:MODERATOR`, { mod: message.author.username }), message.author.avatarURL)
    .addField(
      language(`moderation/modlog:MEMBER`),
      language(`moderation/warn:MEMBER_INFO`, { member: member?.mention, user: member.username, id: member.id })
    )
    .addField(language(`common:REASON`), reason)
    .setThumbnail(user.avatarURL)
    .setTimestamp()
    .setFooter(language(`moderation/modlog:CASE`, { id: modlogID }))

  return message.channel.createMessage({ embed: response.code })
})
