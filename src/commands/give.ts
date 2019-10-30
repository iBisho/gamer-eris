import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, Role } from 'eris'
import { GuildSettings } from '../lib/types/settings'

export default new Command(`give`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  const settings = (await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) as GuildSettings | null
  const language = Gamer.i18n.get(settings ? settings.language : 'en-US')
  if (!language) return

  // If the user does not have a modrole or admin role quit out
  if (
    !settings ||
    Gamer.helpers.discord.isModerator(message, settings.staff.modRoleIDs) ||
    (settings.staff.adminRoleID && Gamer.helpers.discord.isAdmin(message, settings.staff.adminRoleID))
  )
    return

  // Check if the bot has the permission to manage roles
  const bot = message.channel.guild.members.get(Gamer.user.id)
  if (!bot || !bot.permission.has('manageRoles'))
    return message.channel.createMessage(language(`roles/give:MISSING_MANAGE_ROLES`))

  const [userID, roleNameOrID] = args
  // If a user is mentioned use the mention else see if a user id was provided
  const [user] = message.mentions
  const member = message.channel.guild.members.get(user ? user.id : userID)
  if (!member) return message.channel.createMessage(language(`roles/give:NEED_USER`))
  // if a role is mentioned use the mentioned role else see if a role id or role name was provided
  const [roleID] = message.roleMentions
  const role = roleID
    ? message.channel.guild.roles.get(roleID)
    : message.channel.guild.roles.find(
        r => r.id === roleNameOrID || r.name.toLowerCase() === roleNameOrID.toLowerCase()
      )
  if (!role) return message.channel.createMessage(language(`roles/give:NEED_ROLE`))

  // Check if the bots role is high enough to manage the role
  const botsRoles = bot.roles.sort(
    (a, b) => (bot.guild.roles.get(b) as Role).position - (bot.guild.roles.get(a) as Role).position
  )
  const [botsHighestRoleID] = botsRoles
  const botsHighestRole = bot.guild.roles.get(botsHighestRoleID)
  if (!botsHighestRole) return
  if (botsHighestRole.position < role.position) return message.channel.createMessage(language(`roles/give:BOT_TOO_LOW`))
  // Check if the authors role is high enough to grant this role
  if (!message.member) return
  const memberRoles = message.member.roles.sort(
    (a, b) => (bot.guild.roles.get(b) as Role).position - (bot.guild.roles.get(a) as Role).position
  )
  const [memberHighestRoleID] = memberRoles
  const memberHighestRole = bot.guild.roles.get(memberHighestRoleID)
  if (!memberHighestRole) return
  if (memberHighestRole.position < role.position)
    return message.channel.createMessage(language(`roles/give:USER_TOO_LOW`))

  // Give the role to the user as all checks have passed
  member.addRole(
    role.id,
    language(`roles/give:GIVEN_BY`, { user: `${message.author.username}-${message.author.discriminator}` })
  )

  return message.channel.createMessage(language(`roles/give:SUCCESS`, { user: member.username, role: role.name }))
})
