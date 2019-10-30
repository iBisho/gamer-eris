import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, Role } from 'eris'
import { GuildSettings } from '../lib/types/settings'

export default new Command([`role`, `rank`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  const settings = (await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) as GuildSettings | null
  const language = Gamer.i18n.get(settings ? settings.language : 'en-US')
  if (!language) return

  // If there are no settings then there are no public roles
  if (!settings) return message.channel.createMessage(language(`roles/role:NO_PUBLIC_ROLES`))
  // Check if the bot has the permission to manage roles
  const bot = message.channel.guild.members.get(Gamer.user.id)
  if (!bot || !bot.permission.has('manageRoles'))
    return message.channel.createMessage(language(`roles/role:MISSING_MANAGE_ROLES`))

  const [roleNameOrID] = args
  // if a role is mentioned use the mentioned role else see if a role id or role name was provided
  const [roleID] = message.roleMentions
  const role = roleID
    ? message.channel.guild.roles.get(roleID)
    : message.channel.guild.roles.find(
        r => r.id === roleNameOrID || r.name.toLowerCase() === roleNameOrID.toLowerCase()
      )
  if (!role) return message.channel.createMessage(language(`roles/role:NEED_ROLE`))

  // Check if the bots role is high enough to manage the role
  const botsRoles = bot.roles.sort(
    (a, b) => (bot.guild.roles.get(b) as Role).position - (bot.guild.roles.get(a) as Role).position
  )
  const [botsHighestRoleID] = botsRoles
  const botsHighestRole = bot.guild.roles.get(botsHighestRoleID)
  if (!botsHighestRole) return
  if (botsHighestRole.position < role.position) return message.channel.createMessage(language(`roles/role:BOT_TOO_LOW`))
  // Check if the authors role is high enough to grant this role
  if (!message.member) return

  const hasRole = message.member.roles.includes(role.id)
  const tag = `${message.author.username}-${message.author.discriminator}`

  // Give/tag the role to the user as all checks have passed
  if (hasRole) message.member.removeRole(role.id, language(`roles/role:SELF_REMOVE`, { user: tag }))
  else message.member.addRole(role.id, language(`roles/role:SELF_ASSIGN`, { user: tag }))

  return message.channel.createMessage(
    language(hasRole ? `roles/role:REMOVED` : `roles/role:ADDED`, { user: message.member.username, role: role.name })
  )
})
