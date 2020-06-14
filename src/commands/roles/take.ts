import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { highestRole, userTag } from 'helperis'
import { removeRoleFromMember } from '../../lib/utils/eris'

export default new Command(`take`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const settings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isModOrAdmin(message, settings)) return

  // Check if the bot has the permission to manage roles
  const bot = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!bot || !bot.permission.has('manageRoles'))
    return message.channel.createMessage(language(`roles/take:MISSING_MANAGE_ROLES`))

  const [userID, roleNameOrID] = args
  // If a user is mentioned use the mention else see if a user id was provided
  const [user] = message.mentions
  const member = await Gamer.helpers.discord
    .fetchMember(message.member.guild, user?.id || userID)
    .catch(() => undefined)
  if (!member) return message.channel.createMessage(language(`roles/take:NEED_USER`))
  // if a role is mentioned use the mentioned role else see if a role id or role name was provided
  const [roleID] = message.roleMentions
  const role = roleID
    ? message.member.guild.roles.get(roleID)
    : roleNameOrID
    ? message.member.guild.roles.find(r => r.id === roleNameOrID || r.name.toLowerCase() === roleNameOrID.toLowerCase())
    : undefined
  if (!role) return message.channel.createMessage(language(`roles/take:NEED_ROLE`))

  // Check if the bots role is high enough to manage the role
  const botsHighestRole = highestRole(bot)
  if (botsHighestRole.position < role.position) return message.channel.createMessage(language(`roles/take:BOT_TOO_LOW`))
  // Check if the authors role is high enough to grant this role
  if (!message.member) return
  const memberHighestRole = highestRole(message.member)
  if (memberHighestRole.position < role.position)
    return message.channel.createMessage(language(`roles/take:USER_TOO_LOW`))

  // Give the role to the user as all checks have passed
  removeRoleFromMember(member, role.id, language(`roles/take:GIVEN_BY`, { user: encodeURIComponent(userTag(member)) }))

  Gamer.amplitude.push({
    authorID: message.author.id,
    channelID: message.channel.id,
    guildID: message.guildID,
    messageID: message.id,
    timestamp: message.timestamp,
    memberID: member.id,
    type: 'ROLE_REMOVED'
  })

  return message.channel.createMessage(language(`roles/take:SUCCESS`, { user: member.username, role: role.name }))
})
