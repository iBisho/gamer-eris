import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`kick`, `k`], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!botMember) return

  const language = Gamer.getLanguage(message.guildID)
  // Check if the bot has the kick permissions
  if (!botMember.permission.has('kickMembers'))
    return message.channel.createMessage(language(`moderation/kick:NEED_KICK_PERMS`))

  const [userID, ...text] = args

  const user = (await Gamer.helpers.discord.fetchUser(Gamer, userID)) || message.mentions[0]
  if (!user) return message.channel.createMessage(language(`moderation/kick:NEED_USER`))

  const reason = text.join(` `)
  if (!reason) return message.channel.createMessage(language(`moderation/kick:NEED_REASON`))

  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return

  const member = await Gamer.helpers.discord.fetchMember(message.member.guild, user.id)
  // If this user is still a member in the guild we need to do extra checks
  if (!member) return
  // Checks if the bot is higher than the user
  if (!Gamer.helpers.discord.compareMemberPosition(botMember, member))
    return message.channel.createMessage(language(`moderation/kick:BOT_TOO_LOW`))
  // Checks if the mod is higher than the user
  if (!Gamer.helpers.discord.compareMemberPosition(message.member, member))
    return message.channel.createMessage(language(`moderation/kick:USER_TOO_LOW`))

  const embed = new GamerEmbed()
    .setDescription(language(`moderation/kick:TITLE`, { guildName: message.member.guild.name, user: user.username }))
    .setThumbnail(user.avatarURL)
    .setTimestamp()
    .addField(
      language(`common:REASON`),
      language(`moderation/kick:REASON`, { username: message.author.username, reason })
    )

  // Send the user a message. AWAIT to make sure message is sent before they are kicked and lose access
  const dmChannel = await user.getDMChannel().catch(() => undefined)
  if (dmChannel) dmChannel.createMessage({ embed: embed.code }).catch(() => undefined)

  message.member.guild.kickMember(user.id, reason)

  Gamer.helpers.moderation.createModlog(message, guildSettings, language, user, `kick`, reason)

  return message.channel.createMessage(language(`moderation/kick:SUCCESS`, { username: user.username, reason }))
})
