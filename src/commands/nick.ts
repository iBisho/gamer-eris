import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'

export default new Command([`nick`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || !message.member) return

  const Gamer = context.client as GamerClient
  const botMember = message.channel.guild.members.get(Gamer.user.id)
  if (!botMember) return

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  // Check if the bot has the kick permissions
  if (!botMember.permission.has('manageNicknames'))
    return message.channel.createMessage(language(`moderation/kick:NEED_NICK_PERMS`))

  const REASON = language(`moderation/nick:REASON`, { user: message.author.username })

  // They provided no arguments which means we need to reset the user nickname
  if (!args.length) {
    const botMember = message.channel.guild.members.get(Gamer.user.id)
    if (!botMember) return

    if (!Gamer.helpers.discord.compareMemberPosition(botMember, message.member))
      return message.channel.createMessage(language(`moderation/nick:BOT_TOO_LOW`))

    message.member.edit({ nick: `` }, REASON)
    return message.channel.createMessage(language(`moderation/nick:RESET`))
  }

  const [userID] = args

  const user = message.mentions.length ? message.mentions[0] : Gamer.users.get(userID)

  // They did not provide a user so they are only trying to change their own nickname
  if (!user || user.id === message.author.id) {
    if (!Gamer.helpers.discord.compareMemberPosition(botMember, message.member))
      return message.channel.createMessage(language(`moderation/nick:BOT_TOO_LOW`))

    message.member.edit({ nick: args.join(` `).substring(0, 32) }, REASON)
    return message.channel.createMessage(language(`moderation/nick:EDITED_SELF`))
  }

  // A user must have been provided, so we need to add some extra checks
  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings ? guildSettings.staff.modRoleIDs : []) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  const member = user ? message.channel.guild.members.get(user.id) : message.member
  if (!member) return

  // Check if the bot has permissions to edit this member
  if (!Gamer.helpers.discord.compareMemberPosition(botMember, member))
    return message.channel.createMessage(language(`moderation/nick:BOT_TOO_LOW`))
  // Check if the author has permissions to edit the target
  if (!Gamer.helpers.discord.compareMemberPosition(message.member, member))
    return message.channel.createMessage(language(`moderation/nick:USER_TOO_LOW`))

  // Since a user was provided remove the user id from the args
  args.shift()

  member.edit({ nick: args.join(` `).substring(0, 32) }, REASON)

  return message.channel.createMessage(language(`moderation/nick:EDITED_MEMBER`, { member: member.username }))
})
