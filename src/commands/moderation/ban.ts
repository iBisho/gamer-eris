import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`ban`, `b`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient

  const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!botMember) return

  const language = Gamer.getLanguage(message.guildID)

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })

  // Check if the bot has the ban permissions
  if (!botMember.permission.has('banMembers'))
    return message.channel.createMessage(language(`moderation/ban:NEED_BAN_PERMS`))

  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return

  const [userID, ...text] = args
  if (!userID) return message.channel.createMessage(language(`moderation/ban:NEED_USER`))

  const reason = text.join(` `)
  if (!reason) return message.channel.createMessage(language(`moderation/ban:NEED_REASON`))

  const user = await Gamer.helpers.discord.fetchUser(userID)
  if (!user) return message.channel.createMessage(language(`moderation/ban:NEED_USER`))

  const member = await Gamer.helpers.discord.fetchMember(message.member.guild, user.id)
  // If this user is still a member in the guild we need to do extra checks
  if (member) {
    // Checks if the bot is higher than the user
    if (!Gamer.helpers.discord.compareMemberPosition(botMember, member))
      return message.channel.createMessage(language(`moderation/ban:BOT_TOO_LOW`))
    // Checks if the mod is higher than the user
    if (!Gamer.helpers.discord.compareMemberPosition(message.member, member))
      return message.channel.createMessage(language(`moderation/ban:USER_TOO_LOW`))
  } else {
    // Don't need this checks if the user is still a member in the guild they obv wont be banned already
    const banned = await message.member.guild.getBan(user.id).catch(() => undefined)
    if (banned) return message.channel.createMessage(language(`moderation/ban:ALREADY_BANNED`))
  }

  const embed = new MessageEmbed()
    .setDescription(language(`moderation/ban:TITLE`, { guildName: message.member.guild.name, username: user.username }))
    .setThumbnail(user.avatarURL)
    .setTimestamp()
    .addField(language(`common:REASON`), reason)

  // Send the user a message. AWAIT to make sure message is sent before they are banned and lose access
  const dmChannel = await user.getDMChannel().catch(() => undefined)
  if (dmChannel) dmChannel.createMessage({ embed: embed.code }).catch(() => undefined)

  message.member.guild.banMember(user.id, 1, reason)

  Gamer.helpers.moderation.createModlog(message, guildSettings, language, user, `ban`, reason)

  return message.channel.createMessage(language(`moderation/ban:SUCCESS`, { user: user.username, reason }))
})
