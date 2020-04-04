import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { highestRole } from 'helperis'

export default new Command([`rolefromall`], async (message, args, context) => {
  if (!message.member || !message.guildID) return

  const Gamer = context.client as GamerClient
  const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!botMember || !botMember.permission.has('manageRoles')) return
  if (!message.member.permission.has(`manageRoles`)) return

  const language = Gamer.getLanguage(message.guildID)

  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })

  // If they are using default settings, they won't be vip server
  if (!guildSettings?.vip.isVIP) return message.channel.createMessage(language(`vip/rolefromall:NEED_VIP`))

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  // Join() because role names can have spaces in it
  const roleIDOrName = args.join(' ')

  const role = message.roleMentions.length
    ? // If a role was mentioned use it
      message.member.guild.roles.get(message.roleMentions[0])
    : // ELse if a role id or name was provided
    roleIDOrName
    ? // Check if its a valid role id
      message.member.guild.roles.get(roleIDOrName) ||
      // Check for the role by its name
      message.member.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName.toLowerCase())
    : undefined
  if (!role) return message.channel.createMessage(language(`vip/rolefromall:NEED_ROLE`))

  const botsHighestRole = highestRole(botMember)
  if (botsHighestRole.position < role.position)
    return message.channel.createMessage(language(`vip/rolefromall:BOT_TOO_LOW`))

  const memberHighestRole = highestRole(message.member)
  if (memberHighestRole.position < role.position)
    return message.channel.createMessage(language(`vip/rolefromall:USER_TOO_LOW`))

  const REASON = language(`vip/rolefromall:REASON`, { user: message.author.username })

  message.channel.createMessage(
    language(`vip/rolefromall:PATIENCE`, { amount: message.member.guild.members.size, mention: message.author.mention })
  )

  // Create a counter that will help us rate limit the amount of members we are editing
  // Otherwise all role commands like .role .mute .verify stuff would not work until this finished
  let counter = 0

  for (const member of message.member.guild.members.values()) {
    // If the member doesnt have the role already skip
    if (!member.roles.includes(role.id)) continue

    if (counter === 3) {
      // Make the bot wait for 5 seconds
      await Gamer.helpers.utils.sleep(5)
      counter = 0
    }
    // Incase the role gets deleted during the loop
    if (!member.guild.roles.has(role.id)) continue
    // Increment the counter
    counter++
    // Need this await to make the loop async so that if a user deletes a role it will break in the check above
    await member.removeRole(role.id, REASON).catch(() => undefined)

    Gamer.amplitude.push({
      authorID: message.author.id,
      channelID: message.channel.id,
      guildID: message.guildID,
      messageID: message.id,
      timestamp: message.timestamp,
      memberID: member.id,
      type: 'ROLE_REMOVED'
    })
  }

  return message.channel.createMessage(language(`vip/rolefromall:SUCCESS`, { mention: message.author.mention }))
})
