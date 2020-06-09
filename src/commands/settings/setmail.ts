import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { CategoryChannel } from 'eris'
import { upsertGuild } from '../../database/mongoHandler'

export default new Command(`setmail`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const settings = await upsertGuild(message.guildID)

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings?.staff.adminRoleID)) return

  const [type, ...roleIDsOrNames] = args
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  if (!type) return helpCommand.execute(message, [`setmail`], { ...context, commandName: 'help' })

  const validRoleIDs = message.roleMentions
  for (const roleIDOrName of roleIDsOrNames) {
    const role =
      message.member.guild.roles.get(roleIDOrName) ||
      message.member.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName.toLowerCase())
    if (!role) continue
    validRoleIDs.push(role.id)
  }

  // Remove the type and the leftover should be all words
  args.shift()

  const channelID = message.channelMentions.length ? message.channelMentions[0] : message.channel.id

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
      settings.mails.supportChannelID = channelID
      Gamer.guildSupportChannelIDs.set(message.guildID, channelID)
      settings.save()
      return message.channel.createMessage(language(`settings/setmail:SUPPORT_CHANNEL_SET`))
    case `logs`:
      settings.mails.logChannelID = channelID
      settings.save()
      return message.channel.createMessage(language(`settings/setmail:LOG_CHANNEL_SET`))
    case `roles`:
      if (!validRoleIDs.length) return message.channel.createMessage(language(`settings/setmail:NEED_ROLES`))
      for (const id of validRoleIDs) {
        if (settings.mails.alertRoleIDs.includes(id))
          settings.mails.alertRoleIDs = settings.mails.alertRoleIDs.filter(roleID => roleID !== id)
        else settings.mails.alertRoleIDs.push(id)
      }
      settings.save()
      return message.channel.createMessage(language(`settings/setmail:ALERT_ROLES_UPDATED`))
    case `category`: // This normally doesnt need to be run by a user but in debug scenarios
      // In case this is a category type this will require a category id be passed by the user
      const [categoryID] = roleIDsOrNames
      if (!categoryID) break

      const category = message.member.guild.channels.get(categoryID)
      if (!category || !(category instanceof CategoryChannel)) break

      settings.mails.categoryID = categoryID
      settings.save()
      return message.channel.createMessage(language(`settings/setmail:CATEGORY_UPDATED`))
  }

  return helpCommand.execute(message, [`setmail`], { ...context, commandName: 'help' })
})
