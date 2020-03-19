import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'
import { highestRole } from 'helperis'

export default new Command(`mute`, async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!botMember) return

  const language = Gamer.getLanguage(message.guildID)

  // Check if the bot has the manage roles permissions
  if (!botMember.permission.has('manageRoles'))
    return message.channel.createMessage(language(`moderation/mute:NEED_MANAGE_ROLES`))

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })
  // If there is default settings the mute role won't exist
  if (!guildSettings || !guildSettings.moderation.roleIDs.mute)
    return message.channel.createMessage(language(`moderation/mute:NEED_MUTE_ROLE`))

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings?.staff.modRoleIDs) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  // Check if the mute role exists
  const muteRole = message.member.guild.roles.get(guildSettings.moderation.roleIDs.mute)
  if (!muteRole) return message.channel.createMessage(language(`moderation/mute:NEED_MUTE_ROLE`))

  const [userID] = args
  args.shift()

  const member = await Gamer.helpers.discord.fetchMember(message.member.guild, userID)
  if (!member) return

  const botsHighestRole = highestRole(botMember)
  // Checks if the bot is higher than the user
  if (!Gamer.helpers.discord.compareMemberPosition(botMember, member) || botsHighestRole.position <= muteRole.position)
    return message.channel.createMessage(language(`moderation/mute:BOT_TOO_LOW`))
  // Checks if the mod is higher than the user
  if (!Gamer.helpers.discord.compareMemberPosition(message.member, member))
    return message.channel.createMessage(language(`moderation/mute:USER_TOO_LOW`))

  // If it was a valid duration then remove it from the rest of the text
  const [time] = args
  if (!time) return message.channel.createMessage(language(`moderation/mute:NEED_REASON`))

  const duration = Gamer.helpers.transform.stringToMilliseconds(time)
  if (duration) args.shift()

  const reason = args.join(` `)
  if (!reason) return message.channel.createMessage(language(`moderation/mute:NEED_REASON`))

  await member.addRole(guildSettings.moderation.roleIDs.mute)

  const embed = new GamerEmbed()
    .setDescription(
      language(`moderation/mute:TITLE`, { guildName: message.member.guild.name, user: member.user.username })
    )
    .setThumbnail(member.user.avatarURL)
    .setTimestamp()
    .addField(language(`common:REASON`), reason)

  // Send the user a message
  const dmChannel = await member.user.getDMChannel().catch(() => undefined)
  if (dmChannel) dmChannel.createMessage({ embed: embed.code }).catch(() => undefined)

  const modlogID = await Gamer.helpers.moderation.createModlog(
    message,
    guildSettings,
    language,
    member.user,
    `mute`,
    reason,
    duration
  )

  // Response that will get sent in the channel
  const response = new GamerEmbed()
    .setAuthor(language(`moderation/warn:MODERATOR`, { mod: message.author.username }), message.author.avatarURL)
    .addField(
      language(`moderation/modlog:MEMBER`),
      language(`moderation/warn:MEMBER_INFO`, { member: member.mention, user: member.username, id: member.id })
    )
    .addField(language(`common:REASON`), reason)
    .setTimestamp()
    .setFooter(language(`moderation/modlog:CASE`, { id: modlogID }))

  return message.channel.createMessage({ embed: response.code })
})
