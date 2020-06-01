import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

interface TagModules {
  aov: string
  [key: string]: string | undefined
}

const modules: TagModules = {
  aov: '293208951473045504'
}

export default new Command([`taguninstall`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.guildID)
  if (!args.length) return helpCommand.execute(message, [`taguninstall`], context)

  const guildSettings =
    (await Gamer.database.models.guild.findOne({
      id: message.guildID
    })) || (await Gamer.database.models.guild.create({ id: message.guildID }))

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  // Check the module and convert it to a server id
  const [module] = args
  const serverID = modules[module] || module

  guildSettings.modules = guildSettings.modules.filter(mod => mod !== serverID)
  guildSettings.save()
  return message.channel.createMessage(language(`tags/taguninstall:REMOVED`))
})
