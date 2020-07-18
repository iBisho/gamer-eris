import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`nick`], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!botMember) return

  const language = Gamer.getLanguage(message.guildID)
  const REASON = language(`moderation/nick:REASON`, { user: encodeURIComponent(message.author.username) })

  // Check if the bot has the kick permissions
  if (!botMember.permission.has('manageNicknames'))
    return message.channel.createMessage(language(`moderation/nick:NEED_NICK_PERMS`))

  // They provided no arguments which means we need to reset the user nickname
  if (!args.length) {
    const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
    if (!botMember) return

    if (
      message.member.id === message.member.guild.ownerID ||
      !Gamer.helpers.discord.compareMemberPosition(botMember, message.member)
    )
      return message.channel.createMessage(language(`moderation/nick:BOT_TOO_LOW`))

    message.member.edit({ nick: `` }, REASON)
    return message.channel.createMessage(language(`moderation/nick:RESET`))
  }

  const [userID] = args
  if (!userID) return

  const member = (await Gamer.helpers.discord.fetchMember(message.member.guild, userID)) || message.member
  if (!member) return

  // They did not provide a user so they are only trying to change their own nickname
  if (member.id === message.author.id) {
    if (member.id === member.guild.ownerID || !Gamer.helpers.discord.compareMemberPosition(botMember, message.member))
      return message.channel.createMessage(language(`moderation/nick:BOT_TOO_LOW`))

    message.member.edit({ nick: args.join(` `).substring(0, 32) }, REASON)
    return message.channel.createMessage(language(`moderation/nick:EDITED_SELF`))
  }

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
  // A user must have been provided, so we need to add some extra checks
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return

  // Check if the bot has permissions to edit this member
  if (!Gamer.helpers.discord.compareMemberPosition(botMember, member))
    return message.channel.createMessage(language(`moderation/nick:BOT_TOO_LOW`))
  // Check if the author has permissions to edit the target
  if (!Gamer.helpers.discord.compareMemberPosition(message.member, member))
    return message.channel.createMessage(language(`moderation/nick:USER_TOO_LOW`))

  // Since a user was provided remove the user id from the args
  args.shift()

  member.edit({ nick: args.join(` `).substring(0, 32) }, REASON)

  return Gamer.helpers.discord.embedResponse(
    message,
    language(`moderation/nick:EDITED_MEMBER`, { member: member.username })
  )
})
