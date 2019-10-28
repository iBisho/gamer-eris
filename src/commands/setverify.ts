import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'

export default new Command(`setverify`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  let guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null
  if (!guildSettings) guildSettings = new Gamer.database.models.guild({ id: message.channel.guild.id }) as GuildSettings

  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : 'en-US')
  if (!language) return

  const [action] = args

  switch (action.toLowerCase()) {
    case 'enable':
      if (guildSettings.verify.enabled)
        return message.channel
          .createMessage(language(`settings/setverify:ALREADY_ENABLED`))
          .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)), 10000))

      guildSettings.verify.enabled = true
      guildSettings.save()
      return message.channel.createMessage(language(`settings/setverify:ENABLED`))
    case 'disable':
      if (!guildSettings.verify.enabled)
        return message.channel
          .createMessage(language(`settings/setverify:ALREADY_DISABLED`))
          .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)), 10000))

      guildSettings.verify.enabled = false
      guildSettings.save()
      return message.channel.createMessage(language(`settings/setverify:DISABLED`))
    case 'role':
      const [roleID] = message.roleMentions
      const role = message.channel.guild.roles.get(roleID)
      if (!role)
        return message.channel
          .createMessage(language(`settings/setverify:NEED_ROLE`))
          .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)), 10000))

      guildSettings.verify.roleID = roleID
      return message.channel.createMessage(language(`settings/setverify:ROLE_SET`, { role: role.name }))
    case 'setup':
      if (guildSettings.verify.enabled)
        return message.channel
          .createMessage(language(`settings/setverify:ALREADY_ENABLED`))
          .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)), 10000))

      const bot = message.channel.guild.members.get(Gamer.user.id)
      if (!bot) return

      if (!bot.permission.has('manageRoles') || !bot.permission.has('manageChannels'))
        return message.channel
          .createMessage(language(`settings/setverify:MISSING_PERMS`))
          .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)), 10000))

      return Gamer.helpers.scripts.createVerificationSystem(Gamer, language, message.channel.guild, guildSettings)
  }

  await message.channel.createMessage(language(`settings/setverify:INVALID_USE`))

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return
  return helpCommand.execute(message, [`setverify`], context)
})
