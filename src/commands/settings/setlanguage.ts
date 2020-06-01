import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'

export default new Command(`setlanguage`, async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  let settings = await Gamer.database.models.guild.findOne({ id: message.guildID })

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings ? settings.staff.adminRoleID : undefined)) return

  const [name] = args
  if (!name) return helpCommand.execute(message, [`setlanguage`], context)

  const personality = constants.personalities.find(p => p.names.includes(name.toLowerCase()))
  if (!personality) return message.channel.createMessage(language(`settings/setlanguage:INVALID_NAME`, { name }))
  if (!settings) settings = await Gamer.database.models.guild.create({ id: message.guildID })

  if (settings.language === personality.id)
    return message.channel.createMessage(language(`settings/setlanguage:ALREADY_ACTIVE`, { name: personality.name }))
  settings.language = personality.id
  settings.save()
  Gamer.guildLanguages.set(message.guildID, personality.id)

  return message.channel.createMessage(language(`settings/setlanguage:SET`, { name: personality.name }))
})
