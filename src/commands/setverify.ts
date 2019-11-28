import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`setverify`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  let guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return
  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return
  if (!guildSettings) guildSettings = await Gamer.database.models.guild.create({ id: message.channel.guild.id })

  const [action] = args

  const helpCommand = Gamer.commandForName('help')

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
      const [roleID] = message.roleMentions
      const role = message.channel.guild.roles.get(roleID)
      if (!role) return message.channel.createMessage(language(`settings/setverify:NEED_ROLE`))

      guildSettings.verify.roleID = roleID
      return message.channel.createMessage(language(`settings/setverify:ROLE_SET`, { role: role.name }))
    case 'message':
      args.shift()
      const jsonString = args.join(` `)
      let json: unknown
      try {
        json = JSON.parse(jsonString)
      } catch {
        json = null
      }
      if (!json) {
        message.channel.createMessage(language(`settings/setverify:INVALID_JSON_MESSAGE`))

        if (!helpCommand) return
        return helpCommand.execute(message, [`embed`], context)
      }

      guildSettings.verify.firstMessageJSON = jsonString
      guildSettings.save()
      return message.channel.createMessage(language(`settings/setverify:JSON_MESSAGE_SET`))
    case 'setup':
      if (guildSettings.verify.enabled)
        return message.channel.createMessage(language(`settings/setverify:ALREADY_ENABLED`))

      const bot = message.channel.guild.members.get(Gamer.user.id)
      if (!bot) return

      if (!bot.permission.has('manageRoles') || !bot.permission.has('manageChannels'))
        return message.channel.createMessage(language(`settings/setverify:MISSING_PERMS`))

      return Gamer.helpers.scripts.createVerificationSystem(message.channel.guild, guildSettings)
  }

  await message.channel.createMessage(language(`settings/setverify:INVALID_USE`))

  if (!helpCommand) return
  return helpCommand.execute(message, [`setverify`], context)
})
