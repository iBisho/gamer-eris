import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { upsertGuild } from '../../database/mongoHandler'

export default new Command(`setlogs`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const helpCommand = Gamer.commandForName(`help`)

  const settings = await upsertGuild(message.member.guild.id)
  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings?.staff.adminRoleID)) return

  const [type] = args
  if (!type) return helpCommand?.execute(message, [`setlogs`], { ...context, commandName: 'help' })

  switch (type.toLowerCase()) {
    case `setup`:
      await Gamer.helpers.scripts.createLogSystem(message.member.guild, settings)
      return message.channel.createMessage(language(`settings/setlogs:SETUP`, { mention: message.author.mention }))
  }

  return helpCommand?.execute(message, [`setlogs`], { ...context, commandName: 'help' })
})
