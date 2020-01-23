import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`setmute`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  let guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return
  if (!guildSettings) guildSettings = await Gamer.database.models.guild.create({ id: message.guildID })

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const [action] = args
  if (!action) return helpCommand.process(message, [`setmute`], context)

  switch (action.toLowerCase()) {
    case 'setup':
      await Gamer.helpers.scripts.createMuteSystem(message.member.guild, guildSettings)
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
