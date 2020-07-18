import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { highestRole, MessageEmbed } from 'helperis'
import { addRoleToMember, removeRoleFromMember } from '../../lib/utils/eris'
import { parseRole } from '../../lib/utils/arguments'

export default new Command([`role`, `rank`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const settings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
  const language = Gamer.getLanguage(message.guildID)

  // If there are no settings then there are no public roles
  if (!settings || !settings.moderation.roleIDs.public.length)
    return message.channel.createMessage(language(`roles/role:NO_PUBLIC_ROLES`))
  // Check if the bot has the permission to manage roles
  const bot = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!bot || !bot.permission.has('manageRoles'))
    return message.channel.createMessage(language(`roles/role:MISSING_MANAGE_ROLES`))

  const [roleNameOrID] = args
  // No args were provided so we just list the public roles
  if (!roleNameOrID) {
    // Send in an embed so the role @ do not go through
    const embed = new MessageEmbed()
      .setAuthor(message.author.username, message.author.avatarURL)
      .setTitle(language(`roles/role:AVAILABLE`))
      .setDescription(settings.moderation.roleIDs.public.map(id => `<@&${id}>`).join(' '))
    return message.channel.createMessage({ embed: embed.code })
  }

  const role = parseRole(message, roleNameOrID)
  if (!role) return message.channel.createMessage(language(`roles/role:NEED_ROLE`))

  if (!settings.moderation.roleIDs.public.includes(role.id))
    return message.channel.createMessage(language(`roles/role:NOT_PUBLIC`))

  // Check if the bots role is high enough to manage the role
  const botsHighestRole = highestRole(bot)
  if (botsHighestRole.position < role.position) return message.channel.createMessage(language(`roles/role:BOT_TOO_LOW`))

  // Check if the authors role is high enough to grant this role
  const hasRole = message.member.roles.includes(role.id)
  const tag = `${message.author.username}-${message.author.discriminator}`

  // Give/tag the role to the user as all checks have passed
  if (hasRole) removeRoleFromMember(message.member, role.id, language(`roles/role:SELF_REMOVE`, { user: tag }))
  else addRoleToMember(message.member, role.id, language(`roles/role:SELF_ASSIGN`, { user: tag }))

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
