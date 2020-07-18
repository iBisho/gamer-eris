import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { upsertGuild } from '../../database/mongoHandler'

const modules = new Map<string, string>().set('aov', '293208951473045504')

export default new Command([`taginstall`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.guildID)
  const [module] = args
  if (!module) return helpCommand.execute(message, [`taginstall`], { ...context, commandName: 'help' })

  // If the user is not an admin cancel out
  const guildSettings = await upsertGuild(message.guildID)
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  // Check the module and convert it to a server id
  const serverID = modules.get(module) || module

  guildSettings.modules.push(serverID)
  guildSettings.save()
  return message.channel.createMessage(language(`tags/taginstall:IMPORTED`))
})
