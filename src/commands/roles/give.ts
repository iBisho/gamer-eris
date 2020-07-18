import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { highestRole, userTag } from 'helperis'
import { addRoleToMember } from '../../lib/utils/eris'
import { parseRole } from '../../lib/utils/arguments'

export default new Command(`give`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.guildID)

  const settings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isModOrAdmin(message, settings)) return

  // Check if the bot has the permission to manage roles
  const bot = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!bot || !bot.permission.has('manageRoles'))
    return message.channel.createMessage(language(`roles/give:MISSING_MANAGE_ROLES`))

  const [id, roleNameOrID] = args
  // If a user is mentioned use the mention else see if a user id was provided
  const [user] = message.mentions
  const userID = user?.id || id
  if (!userID) return message.channel.createMessage(language(`roles/give:NEED_USER`))
  if (!roleNameOrID) return helpCommand.execute(message, [`give`], { ...context, commandName: 'help' })

  const member = await Gamer.helpers.discord.fetchMember(message.member.guild, userID)
  if (!member) return message.channel.createMessage(language(`roles/give:NEED_USER`))

  const role = parseRole(message, roleNameOrID)
  if (!role) return message.channel.createMessage(language(`roles/give:NEED_ROLE`))

  // Check if the bots role is high enough to manage the role
  const botsHighestRole = highestRole(bot)
  if (botsHighestRole.position < role.position) return message.channel.createMessage(language(`roles/give:BOT_TOO_LOW`))
  // Check if the authors role is high enough to grant this role
  if (!message.member) return

  const memberHighestRole = highestRole(message.member)
  if (memberHighestRole.position < role.position)
    return message.channel.createMessage(language(`roles/give:USER_TOO_LOW`))

  // Give the role to the user as all checks have passed
  addRoleToMember(member, role.id, language(`roles/give:GIVEN_BY`, { user: encodeURIComponent(userTag(member)) }))
  Gamer.amplitude.push({
    authorID: message.author.id,
    channelID: message.channel.id,
    guildID: message.guildID,
    messageID: message.id,
    timestamp: message.timestamp,
    memberID: member.id,
    type: 'ROLE_ADDED'
  })

  return message.channel.createMessage(language(`roles/give:SUCCESS`, { user: member.username, role: role.name }))
})
