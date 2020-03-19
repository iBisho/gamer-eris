import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../lib/structures/GamerClient'
import { highestRole } from 'helperis'

export default new Command(`unmute`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!botMember) return

  const language = Gamer.getLanguage(message.guildID)

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })
  // If there is default settings the mute role won't exist
  if (!guildSettings || !guildSettings.moderation.roleIDs.mute)
    return message.channel.createMessage(language(`moderation/unmute:NEED_MUTE_ROLE`))

  // Check if the bot has the ban permissions
  if (!botMember.permission.has('manageRoles'))
    return message.channel.createMessage(language(`moderation/unmute:NEED_MANAGE_ROLES`))

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings?.staff.modRoleIDs) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  // Check if the mute role exists
  const muteRole = message.member.guild.roles.get(guildSettings.moderation.roleIDs.mute)
  if (!muteRole) return

  const botsHighestRole = highestRole(botMember)
  if (botsHighestRole.position <= muteRole.position)
    return message.channel.createMessage(language(`moderation/unmute:BOT_TOO_LOW`))

  const [userID] = args
  args.shift()

  const user = (await Gamer.helpers.discord.fetchUser(Gamer, userID)) || message.mentions[0]
  if (!user) return message.channel.createMessage(language(`moderation/unmute:NEED_USER`))

  // If it was a valid duration then remove it from the rest of the text
  const [time] = args
  const duration = Gamer.helpers.transform.stringToMilliseconds(time)
  if (duration) args.shift()

  const reason = args.join(` `)
  if (!reason) return message.channel.createMessage(language(`moderation/unmute:NEED_REASON`))

  const member = await Gamer.helpers.discord.fetchMember(message.member.guild, user.id)
  if (!member) return

  if (!member.roles.includes(muteRole.id)) return message.channel.createMessage(language(`moderation/unmute:NOT_MUTED`))

  // Checks if the bot is higher than the user
  if (!Gamer.helpers.discord.compareMemberPosition(botMember, member))
    return message.channel.createMessage(language(`moderation/unmute:BOT_TOO_LOW`))
  // Checks if the mod is higher than the user
  if (!Gamer.helpers.discord.compareMemberPosition(message.member, member))
    return message.channel.createMessage(language(`moderation/unmute:USER_TOO_LOW`))

  await member.removeRole(guildSettings.moderation.roleIDs.mute)

  const embed = new MessageEmbed()
    .setDescription(
      language(`moderation/unmute:TITLE`, { guildName: message.member.guild.name, username: user.username })
    )
    .setThumbnail(user.avatarURL)
    .setTimestamp()
    .addField(language(`common:REASON`), reason)

  // Send the user a message. AWAIT to make sure message is sent before they are banned and lose access
  const dmChannel = await user.getDMChannel().catch(() => undefined)
  if (dmChannel) dmChannel.createMessage({ embed: embed.code }).catch(() => undefined)

  const modlogID = await Gamer.helpers.moderation.createModlog(
    message,
    guildSettings,
    language,
    user,
    `unmute`,
    reason,
    duration
  )

  // Response that will get sent in the channel
  const response = new MessageEmbed()
    .setAuthor(language(`moderation/warn:MODERATOR`, { mod: message.author.username }), message.author.avatarURL)
    .addField(
      language(`moderation/modlog:MEMBER`),
      language(`moderation/warn:MEMBER_INFO`, { member: member?.mention, user: member.username, id: member.id })
    )
    .addField(language(`common:REASON`), reason)
    .setTimestamp()
    .setFooter(language(`moderation/modlog:CASE`, { id: modlogID }))

  message.channel.createMessage({ embed: response.code })

  // Set this users mute log to no no longer need to unmute the user
  const log = await Gamer.database.models.modlog.findOne({
    action: `mute`,
    userID: member.id,
    guildID: member.guild.id,
    needsUnmute: true
  })

  if (!log) return
  log.needsUnmute = false
  return log.save()
})
