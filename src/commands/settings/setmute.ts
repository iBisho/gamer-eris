import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { upsertGuild } from '../../database/mongoHandler'

export default new Command(`setmute`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const guildSettings = await upsertGuild(message.guildID)

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const [action] = args
  if (!action) return helpCommand.execute(message, [`setmute`], { ...context, commandName: 'help' })

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

  return helpCommand.execute(message, [`setmute`], { ...context, commandName: 'help' })
})
