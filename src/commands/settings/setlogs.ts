import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command(`setlogs`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const helpCommand = Gamer.commandForName(`help`)

  let settings = await Gamer.database.models.guild.findOne({ id: message.guildID })
  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings?.staff.adminRoleID)) return

  const [type] = args
  if (!type) return helpCommand?.process(message, [`setlogs`], context)

  switch (type.toLowerCase()) {
    case `setup`:
      if (!settings) settings = await Gamer.database.models.guild.create({ id: message.guildID })
      await Gamer.helpers.scripts.createLogSystem(message.member.guild, settings)
      return message.channel.createMessage(language(`settings/setlogs:SETUP`, { mention: message.author.mention }))
  }

  return helpCommand?.process(message, [`setlogs`], context)
})
