import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, Role } from 'eris'
import { GuildSettings } from '../lib/types/settings'

export default new Command(`public`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  let settings = (await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) as GuildSettings | null
  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings ? settings.staff.adminRoleID : undefined)) return

  const [type] = args
  // Remove the type and the leftover should be all roles
  args.shift()

  const validRoles = new Set<Role>()

  const bot = message.channel.guild.members.get(Gamer.user.id)
  if (!bot) return
  // Check if the bots role is high enough to manage the role
  const botsRoles = bot.roles.sort(
    (a, b) => (bot.guild.roles.get(b) as Role).position - (bot.guild.roles.get(a) as Role).position
  )
  const [botsHighestRoleID] = botsRoles
  const botsHighestRole = bot.guild.roles.get(botsHighestRoleID)
  if (!botsHighestRole) return

  for (const roleNameOrID of args) {
    const role =
      message.channel.guild.roles.get(roleNameOrID) ||
      message.channel.guild.roles.find(
        r => r.id === roleNameOrID || r.name.toLowerCase() === roleNameOrID.toLowerCase()
      )
    if (!role || (type === `add` && botsHighestRole.position <= role.position)) continue
    if (type === `add` && settings && settings.moderation.roleIDs.public.includes(role.id)) continue
    if (type === `remove` && settings && !settings.moderation.roleIDs.public.includes(role.id)) continue

    validRoles.add(role)
  }

  if (!validRoles.size) return message.channel.createMessage(`roles/public:NO_VALID_ROLES`)

  if (!settings) settings = new Gamer.database.models.guild({ id: message.channel.guild.id }) as GuildSettings
  const roleIDs = [...validRoles].map(role => role.id)
  const roleNames = [...validRoles].map(role => role.name)

  switch (type.toLowerCase()) {
    case `add`:
      settings.moderation.roleIDs.public = roleIDs
      settings.save()
      return message.channel.createMessage(language(`roles/public:ADDED`, { roles: roleNames }))
    case `remove`:
      settings.moderation.roleIDs.public = settings.moderation.roleIDs.public.filter(id => !roleIDs.includes(id))
      settings.save()
      return message.channel.createMessage(language(`roles/public:REMOVED`, { roles: roleNames }))
  }

  return
})
