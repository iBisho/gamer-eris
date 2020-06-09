import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { Role } from 'eris'
import { highestRole } from 'helperis'
import { upsertGuild } from '../../database/mongoHandler'

export default new Command(`public`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const settings = await upsertGuild(message.member.guild.id)
  const language = Gamer.getLanguage(message.guildID)

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings ? settings.staff.adminRoleID : undefined)) return

  const [type] = args
  // Remove the type and the leftover should be all roles
  args.shift()

  const validRoles = new Set<Role>()

  const bot = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!bot) return

  const botsHighestRole = highestRole(bot)
  if (!botsHighestRole) return

  for (const roleNameOrID of [...args, ...message.roleMentions]) {
    const role =
      message.member.guild.roles.get(roleNameOrID) ||
      message.member.guild.roles.find(r => r.id === roleNameOrID || r.name.toLowerCase() === roleNameOrID.toLowerCase())
    if (!role || (type === `add` && botsHighestRole.position <= role.position)) continue
    if (type === `add` && settings && settings.moderation.roleIDs.public.includes(role.id)) continue
    if (type === `remove` && settings && !settings.moderation.roleIDs.public.includes(role.id)) continue

    validRoles.add(role)
  }

  if (!validRoles.size) return message.channel.createMessage(language(`roles/public:NO_VALID_ROLES`))

  const roleIDs = [...validRoles].map(role => role.id)
  const roleNames = [...validRoles].map(role => role.name)

  switch (type.toLowerCase()) {
    case `add`:
      for (const id of roleIDs) settings.moderation.roleIDs.public.push(id)
      settings.save()
      return message.channel.createMessage(language(`roles/public:ADDED`, { roles: roleNames }))
    case `remove`:
      settings.moderation.roleIDs.public = settings.moderation.roleIDs.public.filter(id => !roleIDs.includes(id))
      settings.save()
      return message.channel.createMessage(language(`roles/public:REMOVED`, { roles: roleNames }))
  }

  return
})
