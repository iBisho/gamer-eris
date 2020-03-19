import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { Role } from 'eris'
import { MessageEmbed } from 'helperis'

export default new Command([`role`, `rank`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const settings = await Gamer.database.models.guild.findOne({ id: message.guildID })
  const language = Gamer.getLanguage(message.guildID)

  // If there are no settings then there are no public roles
  if (!settings || !settings.moderation.roleIDs.public.length)
    return message.channel.createMessage(language(`roles/role:NO_PUBLIC_ROLES`))
  // Check if the bot has the permission to manage roles
  const bot = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!bot || !bot.permission.has('manageRoles'))
    return message.channel.createMessage(language(`roles/role:MISSING_MANAGE_ROLES`))

  const [roleNameOrID] = args
  // if a role is mentioned use the mentioned role else see if a role id or role name was provided
  const [roleID] = message.roleMentions
  // No args were provided so we just list the public roles
  if (!args.length) {
    // Send in an embed so the role @ do not go through
    const embed = new MessageEmbed()
      .setAuthor(message.author.username, message.author.avatarURL)
      .setTitle(language(`roles/role:AVAILABLE`))
      .setDescription(settings.moderation.roleIDs.public.map(id => `<@&${id}>`).join(' '))
    return message.channel.createMessage({ embed: embed.code })
  }

  const role = roleID
    ? message.member.guild.roles.get(roleID)
    : message.member.guild.roles.find(r => r.id === roleNameOrID || r.name.toLowerCase() === roleNameOrID.toLowerCase())
  if (!role) return message.channel.createMessage(language(`roles/role:NEED_ROLE`))
  if (!settings.moderation.roleIDs.public.includes(role.id))
    return message.channel.createMessage(language(`roles/role:NOT_PUBLIC`))
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

  Gamer.helpers.discord.embedResponse(
    message,
    language(hasRole ? `roles/role:REMOVED` : `roles/role:ADDED`, { user: message.member.username, role: role.name })
  )

  Gamer.amplitude.push({
    authorID: message.author.id,
    channelID: message.channel.id,
    guildID: message.guildID,
    messageID: message.id,
    timestamp: message.timestamp,
    memberID: message.member.id,
    type: hasRole ? 'ROLE_REMOVED' : 'ROLE_ADDED'
  })
  return Gamer.helpers.levels.completeMission(message.member, `role`, message.guildID)
})
