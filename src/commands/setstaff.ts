import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`setstaff`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings =
    (await Gamer.database.models.guild.findOne({
      id: message.channel.guild.id
    })) || (await Gamer.database.models.guild.create({ id: message.channel.guild.id }))

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return
  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  const [type, ...text] = args
  if (!type) return helpCommand.process(message, [`setstaff`], context)

  // Role names can have spaces in them
  const roleIDOrName = text.join(' ')

  const [roleMentionID] = message.roleMentions
  const role =
    message.channel.guild.roles.get(roleMentionID || roleIDOrName) ||
    message.channel.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName.toLowerCase())

  if (!role) return message.channel.createMessage(language('settings/setstaff:INVALID_ROLE'))

  switch (type.toLowerCase()) {
    case `admin`:
    case `admins`:
      if (guildSettings.staff.adminRoleID === role.id) {
        guildSettings.staff.adminRoleID = undefined
        guildSettings.save()
        return message.channel.createMessage(language(`settings/setstaff:ADMINROLE_RESET`))
      }

      guildSettings.staff.adminRoleID = role.id
      guildSettings.save()
      return message.channel.createMessage(language(`settings/setstaff:ADMINROLE_SET`))
    case `mod`:
    case `mods`:
      const exists = guildSettings.staff.modRoleIDs.includes(role.id)
      if (exists) guildSettings.staff.modRoleIDs = guildSettings.staff.modRoleIDs.filter(id => id !== role.id)
      else guildSettings.staff.modRoleIDs.push(role.id)
      guildSettings.save()
      return message.channel.createMessage(
        language(exists ? `settings/setstaff:MODROLE_REMOVED` : `settings/setstaff:MODROLE_ADDED`)
      )
  }

  return helpCommand.process(message, [`setstaff`], context)
})
