import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { upsertGuild } from '../../database/mongoHandler'

interface TagModules {
  aov: string
  [key: string]: string | undefined
}

const modules: TagModules = {
  aov: '293208951473045504'
}

export default new Command([`taguninstall`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.guildID)
  const [module] = args
  if (!module) return helpCommand.execute(message, [`taguninstall`], { ...context, commandName: 'help' })

  const guildSettings = await upsertGuild(message.guildID)

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  const serverID = modules[module] || module

  guildSettings.modules = guildSettings.modules.filter(mod => mod !== serverID)
  guildSettings.save()
  return message.channel.createMessage(language(`tags/taguninstall:REMOVED`))
})
