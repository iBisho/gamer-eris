import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { upsertGuild } from '../../database/mongoHandler'

export default new Command(`setverify`, async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const guildSettings = await upsertGuild(message.member.guild.id)
  const language = Gamer.getLanguage(message.member.guild.id)
  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const [action, roleIDOrName] = args
  if (!action) return helpCommand.execute(message, [`setverify`], { ...context, commandName: 'help' })

  const role = message.roleMentions[0]
    ? message.member.guild.roles.get(message.roleMentions[0])
    : roleIDOrName
    ? message.member.guild.roles.get(roleIDOrName) ||
      message.member.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName.toLowerCase())
    : undefined

  switch (action.toLowerCase()) {
    case 'enable':
      if (guildSettings.verify.enabled)
        return message.channel.createMessage(language(`settings/setverify:ALREADY_ENABLED`))

      guildSettings.verify.enabled = true
      guildSettings.save()
      return message.channel.createMessage(language(`settings/setverify:ENABLED`))
    case 'disable':
      if (!guildSettings.verify.enabled)
        return message.channel.createMessage(language(`settings/setverify:ALREADY_DISABLED`))

      guildSettings.verify.enabled = false
      guildSettings.save()
      return message.channel.createMessage(language(`settings/setverify:DISABLED`))
    case 'internal':
      guildSettings.verify.discordVerificationStrictnessEnabled = !guildSettings.verify
        .discordVerificationStrictnessEnabled
      guildSettings.save()

      return message.channel.createMessage(
        language(
          guildSettings.verify.discordVerificationStrictnessEnabled
            ? `settings/setverify:INTERNAL_ENABLED`
            : `settings/setverify:INTERNAL_DISABLED`,
          {
            prefix: guildSettings.prefix
          }
        )
      )
    case 'role':
      if (!role) return message.channel.createMessage(language(`settings/setverify:NEED_ROLE`))

      guildSettings.verify.roleID = role.id
      guildSettings.save()
      return message.channel.createMessage(language(`settings/setverify:ROLE_SET`, { role: role.name }))
    case 'message':
      args.shift()
      const jsonString = args.join(` `)
      let json: unknown
      try {
        json = JSON.parse(jsonString)
      } catch {}
      if (!json) {
        message.channel.createMessage(language(`settings/setverify:INVALID_JSON_MESSAGE`))

        if (!helpCommand) return
        return helpCommand.execute(message, [`embed`], { ...context, commandName: 'help' })
      }

      guildSettings.verify.firstMessageJSON = jsonString
      guildSettings.save()
      return message.channel.createMessage(language(`settings/setverify:JSON_MESSAGE_SET`))
    case 'setup':
      if (guildSettings.verify.enabled)
        return message.channel.createMessage(language(`settings/setverify:ALREADY_ENABLED`))

      const bot = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
      if (!bot) return

      if (!bot.permission.has('manageRoles') || !bot.permission.has('manageChannels'))
        return message.channel.createMessage(language(`settings/setverify:MISSING_PERMS`))

      return Gamer.helpers.scripts.createVerificationSystem(message.member.guild, guildSettings)
    case 'autorole':
      guildSettings.moderation.roleIDs.autorole = role?.id
      guildSettings.save()
      return message.channel.createMessage(
        language(role ? `settings/setverify:AUTOROLE_SET` : `settings/setverify:AUTOROLE_RESET`, { role: role?.name })
      )
  }

  await message.channel.createMessage(language(`settings/setverify:INVALID_USE`))

  if (!helpCommand) return
  return helpCommand.execute(message, [`setverify`], { ...context, commandName: 'help' })
})
