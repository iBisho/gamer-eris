import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'

export default new Command([`ban`, `b`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const botMember = message.channel.guild.members.get(Gamer.user.id)
  if (!botMember) return

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  // Check if the bot has the ban permissions
  if (!botMember.permission.has('banMembers'))
    return message.channel.createMessage(language(`moderation/ban:NEED_BAN_PERMS`))

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings ? guildSettings.staff.modRoleIDs : []) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  const [userID, ...text] = args

  const user = Gamer.users.get(userID) || message.mentions[0]
  if (!user) return message.channel.createMessage(language(`moderation/ban:NEED_USER`))
  const reason = text.join(` `)
  if (!reason) return message.channel.createMessage(language(`moderation/ban:NEED_REASON`))

  const member = message.channel.guild.members.get(user.id)
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
    const banned = await message.channel.guild.getBan(user.id).catch(() => undefined)
    if (banned) return message.channel.createMessage(language(`moderation/ban:ALREADY_BANNED`))
  }

  const embed = new GamerEmbed()
    .setDescription(language(`moderation/ban:TITLE`, { guildName: message.channel.guild.name, user: user.username }))
    .setThumbnail(user.avatarURL)
    .setTimestamp()
    .addField(language(`common:REASON`), language(`moderation/ban:REASON`, { user: message.author.username, reason }))

  // Send the user a message. AWAIT to make sure message is sent before they are banned and lose access
  const dmChannel = await user.getDMChannel().catch(() => undefined)
  if (dmChannel) dmChannel.createMessage({ embed: embed.code }).catch(() => undefined)

  message.channel.guild.banMember(user.id, 1, reason)

  Gamer.helpers.moderation.createModlog(message, guildSettings, language, user, `ban`, reason)

  return message.channel.createMessage(language(`moderation/ban:SUCCESS`, { user: user.mention, reason }))
})
