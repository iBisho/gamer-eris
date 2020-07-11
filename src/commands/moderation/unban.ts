import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command(`unban`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  const language = Gamer.getLanguage(message.guildID)

  // Check if the bot has the unban permissions
  if (!botMember?.permission.has('banMembers'))
    return message.channel.createMessage(language(`moderation/unban:NEED_BAN_PERMS`))

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })

  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return

  const [userID, ...text] = args

  const user = (await Gamer.helpers.discord.fetchUser(userID)) || message.mentions[0]
  if (!user) return message.channel.createMessage(language(`moderation/unban:NEED_USER`))

  const reason = text.join(` `)
  if (!reason) return message.channel.createMessage(language(`moderation/unban:NEED_REASON`))

  const banned = await message.member.guild.getBan(user.id).catch(() => undefined)
  if (!banned) return message.channel.createMessage(language(`moderation/unban:NOT_BANNED`))

  const embed = new MessageEmbed()
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
