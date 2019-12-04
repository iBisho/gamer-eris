import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, CategoryChannel, GroupChannel } from 'eris'

export default new Command(`setmail`, async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return
  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  let settings = await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings?.staff.adminRoleID)) return

  const [type, ...roleIDsOrNames] = args
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  if (!type) return helpCommand.execute(message, [`setmail`], context)

  const validRoleIDs = message.roleMentions
  for (const roleIDOrName of roleIDsOrNames) {
    const role =
      message.channel.guild.roles.get(roleIDOrName) ||
      message.channel.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName.toLowerCase())
    if (!role) continue
    validRoleIDs.push(role.id)
  }

  // Remove the type and the leftover should be all words
  args.shift()

  if (!settings) settings = await Gamer.database.models.guild.create({ id: message.channel.guild.id })

  switch (type.toLowerCase()) {
    case `enable`:
      if (settings.mails.enabled) return message.channel.createMessage(language(`settings/setmail:ALREADY_ENABLED`))
      settings.mails.enabled = true
      settings.save()
      return message.channel.createMessage(language(`settings/setmail:ENABLED`))
    case `disable`:
      if (!settings.mails.enabled) return message.channel.createMessage(language(`settings/setmail:ALREADY_DISABLED`))
      settings.mails.enabled = false
      settings.save()
      return message.channel.createMessage(language(`settings/setmail:DISABLED`))
    case `channel`:
      const channelID = message.channelMentions.length ? message.channelMentions[0] : message.channel.id
      settings.mails.supportChannelID = channelID
      Gamer.guildSupportChannelIDs.set(message.channel.guild.id, channelID)
      settings.save()
      return message.channel.createMessage(language(`settings/setmail:SUPPORT_CHANNEL_SET`))
    case `roles`:
      if (!validRoleIDs.length) return message.channel.createMessage(language(`settings/setmail:NEED_ROLES`))
      for (const id of validRoleIDs) {
        if (settings.mails.alertRoleIDs.includes(id))
          settings.mails.alertRoleIDs = settings.mails.alertRoleIDs.filter(roleID => roleID !== id)
        else settings.mails.alertRoleIDs.push(id)
      }
      return message.channel.createMessage(language(`settings/setmail:ALERT_ROLES_UPDATED`))
    case `category`: // This normally doesnt need to be run by a user but in debug scenarios
      // In case this is a category type this will require a category id be passed by the user
      const [categoryID] = roleIDsOrNames
      if (!categoryID) break

      const category = message.channel.guild.channels.get(categoryID)
      if (!category || !(category instanceof CategoryChannel)) break

      settings.mails.categoryID = categoryID
      settings.save()
      return message.channel.createMessage(language(`settings/setmail:CATEGORY_UPDATED`))
  }

  return helpCommand.execute(message, [`setmail`], context)
})
