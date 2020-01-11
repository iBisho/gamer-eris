import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`setmute`, async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return
  const Gamer = context.client as GamerClient

  const language = Gamer.getLanguage(message.channel.guild.id)

  let guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return
  if (!guildSettings) guildSettings = await Gamer.database.models.guild.create({ id: message.channel.guild.id })

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const [action] = args
  if (!action) return helpCommand.process(message, [`setmute`], context)

  switch (action.toLowerCase()) {
    case 'setup':
      await Gamer.helpers.scripts.createMuteSystem(message.channel.guild, guildSettings)
      return message.channel.createMessage(language(`settings/setmute:SETUP`))
    case 'disable':
      if (!guildSettings.moderation.roleIDs.mute)
        return message.channel.createMessage(language(`settings/setmute:ALREADY_DISABLED`))

      guildSettings.moderation.roleIDs.mute = undefined
      guildSettings.save()
      return message.channel.createMessage(language(`settings/setmute:DISABLED`))
  }

  return helpCommand.process(message, [`setmute`], context)
})
