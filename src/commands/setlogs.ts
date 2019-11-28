import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'

export default new Command(`setlogs`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  let settings = await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })
  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings ? settings.staff.adminRoleID : undefined)) return

  const [type] = args
  if (!type) return helpCommand.execute(message, [`setlogs`], context)

  switch (type.toLowerCase()) {
    case `setup`:
      if (!settings) settings = await Gamer.database.models.guild.create({ id: message.channel.guild.id })
      await Gamer.helpers.scripts.createLogSystem(message.channel.guild, settings)
      return message.channel.createMessage(language(`settings/setlogs:SETUP`, { mention: message.author.mention }))
  }

  return helpCommand.execute(message, [`setlogs`], context)
})
