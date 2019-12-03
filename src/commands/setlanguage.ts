import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'
import constants from '../constants'

export default new Command(`setlanguage`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  let settings = await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })
  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings ? settings.staff.adminRoleID : undefined)) return

  const [name] = args

  const personality = constants.personalities.find(p => p.names.includes(name.toLowerCase()))
  if (!personality) return message.channel.createMessage(language(`settings/setlanguage:INVALID_NAME`, { name }))
  if (!settings) settings = await Gamer.database.models.guild.create({ id: message.channel.guild.id })

  if (settings.language === personality.id)
    return message.channel.createMessage(language(`settings/setlanguage:ALREADY_ACTIVE`, { name: personality.name }))
  settings.language = personality.id
  settings.save()
  Gamer.guildLanguages.set(message.channel.guild.id, personality.id)

  return message.channel.createMessage(language(`settings/setlanguage:SET`, { name: personality.name }))
})
