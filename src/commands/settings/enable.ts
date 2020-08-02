/**
 * .enable allcommands
 * .enable allcommands #channel
 * .enable command
 * .enable command #channel
 */

import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

function processPermChange(enable: boolean, isEnabled: boolean, targetIDs: string[], exceptionIDs: string[]) {
  const exceptions = [...exceptionIDs]

  for (const ID of targetIDs) {
    // .setperm allcommands on #channel
    if (enable) {
      if (isEnabled && exceptionIDs.includes(ID)) exceptionIDs = exceptionIDs.filter(id => id !== ID)
      else if (!isEnabled && !exceptionIDs.includes(ID)) exceptionIDs.push(ID)
    } else {
      // .setperm allcommands off #channel
      if (isEnabled && !exceptionIDs.includes(ID)) exceptionIDs.push(ID)
      else if (!isEnabled && exceptionIDs.includes(ID)) exceptionIDs = exceptionIDs.filter(id => id !== ID)
    }
  }

  return exceptions
}
export default new Command([`enable`], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const helpCommand = Gamer.commandForName('help')

  // If the user is not an admin cancel out
  const settings = await Gamer.database.models.guild.findOne({ guildID: message.member.guild.id })
  if (!Gamer.helpers.discord.isAdmin(message, settings?.staff.adminRoleID)) return

  const [commandName, ...targets] = args
  if (!commandName) return helpCommand?.execute(message, [`enable`], { ...context, commandName: 'help' })

  const roleID = targets.join(' ')
  const roleIDs = [...message.roleMentions]
  const channelIDs = new Set(message.channelMentions)
  if (!roleIDs.includes(roleID) && message.member.guild.roles.has(roleID)) roleIDs.push(roleID)

  if (commandName.toLowerCase() === 'allcommands') {
    const perms = Gamer.guildCommandPermissions.get(`${message.guildID}.allcommands`)
    if (!perms) return message.channel.createMessage(language(`settings/setpermission:ALREADY_ENABLED_ALL_COMMANDS`))

    // .enable allcommands
    // .enable allcommands
    if (!targets.length) {
      perms.enabled = true
      perms.exceptionChannelIDs = []
      perms.exceptionRoleIDs = []
      perms.save()

      Gamer.guildCommandPermissions.set(`${message.guildID}.allcommands`, perms)
      return message.channel.createMessage(
        language(
          perms.enabled ? `settings/setpermission:ENABLED_ALL_COMMANDS` : `settings/setpermission:DISABLED_ALL_COMMANDS`
        )
      )
    }

    // Some channel or role was provided to be made an exception
    if (message.channelMentions.length) {
      perms.exceptionChannelIDs = processPermChange(
        true,
        perms.enabled,
        message.channelMentions,
        perms.exceptionChannelIDs
      )
    }
    if (roleIDs.length) {
      perms.exceptionRoleIDs = processPermChange(true, perms.enabled, roleIDs, perms.exceptionRoleIDs)
    }

    perms.save()
    Gamer.guildCommandPermissions.set(`${message.guildID}.allcommands`, perms)
    return message.channel.createMessage(language(`settings/setpermission:COMMAND_UPDATED`))
  }

  if (commandName.toLowerCase() === 'tagusage') {
    const perms = Gamer.guildCommandPermissions.get(`${message.guildID}.tagusage`)
    if (!perms) return message.channel.createMessage(language(`settings/setpermission:ALREADY_ENABLED_TAG_USAGE`))

    // .enable tagusage
    // .enable tagusage
    if (!targets.length) {
      perms.enabled = true
      perms.exceptionChannelIDs = []
      perms.exceptionRoleIDs = []
      perms.save()

      Gamer.guildCommandPermissions.set(`${message.guildID}.tagusage`, perms)
      return message.channel.createMessage(
        language(
          perms.enabled ? `settings/setpermission:ENABLED_TAG_USAGE` : `settings/setpermission:DISABLED_TAG_USAGE`
        )
      )
    }

    // Some channel or role was provided to be made an exception
    if (message.channelMentions.length) {
      perms.exceptionChannelIDs = processPermChange(
        true,
        perms.enabled,
        message.channelMentions,
        perms.exceptionChannelIDs
      )
    }
    if (roleIDs.length) {
      perms.exceptionRoleIDs = processPermChange(true, perms.enabled, roleIDs, perms.exceptionRoleIDs)
    }

    perms.save()
    Gamer.guildCommandPermissions.set(`${message.guildID}.tagusage`, perms)
    return message.channel.createMessage(language(`settings/setpermission:COMMAND_UPDATED`))
  }

  // A specific command was provided
  const command = Gamer.commandForName(commandName)
  if (!command) return helpCommand?.execute(message, [`enable`], { ...context, commandName: 'help' })

  const [name] = command.names

  const perms = Gamer.guildCommandPermissions.get(`${message.guildID}.${name}`)
  const allCommandsPerm = Gamer.guildCommandPermissions.get(`${message.guildID}.allcommands`)
  if (!perms) {
    // .enable ping
    if (!allCommandsPerm)
      return message.channel.createMessage(language(`settings/setpermission:ALREADY_ENABLED_COMMAND`))

    if (allCommandsPerm.enabled) {
      if (!allCommandsPerm.exceptionChannelIDs.length && !allCommandsPerm.exceptionRoleIDs.length)
        return message.channel.createMessage(language(`settings/setpermission:ALREADY_ENABLED_COMMAND`))
    }

    // All commands are enabled but there are exception, to be safe we create perms for this command
    const newPerms = await Gamer.database.models.command.create({
      name: name,
      guildID: message.member.guild.id,
      enabled: !targets.length,
      exceptionChannelIDs: targets.length ? [...channelIDs] : [],
      exceptionRoleIDs: targets.length ? roleIDs : []
    })

    message.channel.createMessage(language(`settings/setpermission:COMMAND_UPDATED`))
    return Gamer.guildCommandPermissions.set(`${message.member.guild.id}.${name}`, newPerms)
  }

  // .enable ping
  if (!targets.length) {
    // Disable/Enable the whole command
    perms.enabled = true
    perms.exceptionChannelIDs = []
    perms.exceptionRoleIDs = []
    perms.save()

    return message.channel.createMessage(language(`settings/setpermission:COMMAND_UPDATED`))
  }

  // .enable ping #channel/role
  if (!channelIDs.size && !roleIDs.length)
    return message.channel.createMessage(language(`settings/setpermission:NO_CHANNELS_ROLES`))

  // Specific channels or roles were targeted
  channelIDs.forEach(channelID => {
    if (perms.enabled && perms.exceptionChannelIDs.includes(channelID))
      perms.exceptionChannelIDs = perms.exceptionChannelIDs.filter(id => id !== channelID)
    if (!perms.enabled && !perms.exceptionChannelIDs.includes(channelID)) perms.exceptionChannelIDs.push(channelID)
  })

  roleIDs.forEach(ID => {
    if (perms.enabled && perms.exceptionRoleIDs.includes(ID))
      perms.exceptionRoleIDs = perms.exceptionRoleIDs.filter(id => id !== ID)
    if (!perms.enabled && !perms.exceptionRoleIDs.includes(ID)) perms.exceptionRoleIDs.push(ID)
  })

  perms.save()
  return message.channel.createMessage(language(`settings/setpermission:COMMAND_UPDATED`))
})
