import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`unban`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const botMember = message.member.guild.members.get(Gamer.user.id)
  if (!botMember) return

  const language = Gamer.getLanguage(message.guildID)

  // Check if the bot has the unban permissions
  if (!botMember.permission.has('banMembers'))
    return message.channel.createMessage(language(`moderation/unban:NEED_BAN_PERMS`))

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings?.staff.modRoleIDs) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  const [userID, ...text] = args

  const user = Gamer.users.get(userID) || message.mentions[0]
  if (!user) return message.channel.createMessage(language(`moderation/unban:NEED_USER`))

  const reason = text.join(` `)
  if (!reason) return message.channel.createMessage(language(`moderation/unban:NEED_REASON`))

  const banned = await message.member.guild.getBan(user.id).catch(() => undefined)
  if (!banned) return message.channel.createMessage(language(`moderation/unban:NOT_BANNED`))

  const embed = new GamerEmbed()
    .setDescription(
      language(`moderation/unban:TITLE`, { guildName: message.member.guild.name, username: user.username })
    )
    .setThumbnail(user.avatarURL)
    .setTimestamp()
    .addField(language(`common:REASON`), reason)

  // Send the user a message. AWAIT to make sure message is sent before they are banned and lose access
  const dmChannel = await user.getDMChannel().catch(() => undefined)
  if (dmChannel) dmChannel.createMessage({ embed: embed.code }).catch(() => undefined)

  message.member.guild.unbanMember(user.id, reason)

  Gamer.helpers.moderation.createModlog(message, guildSettings, language, user, `unban`, reason)

  return message.channel.createMessage(language(`moderation/unban:SUCCESS`, { user: user.username, reason }))
})
