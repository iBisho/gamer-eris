import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'
import constants from '../constants'

export default new Command(`setlanguage`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  let settings = (await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) as GuildSettings | null
  const language = Gamer.i18n.get(settings ? settings.language : 'en-US')
  if (!language) return

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings ? settings.staff.adminRoleID : undefined)) return

  const [name] = args

  const personality = constants.personalities.find(p => p.names.includes(name.toLowerCase()))
  if (!personality) return message.channel.createMessage(language(`settings/setlanguage:INVALID_NAME`, { name }))
  if (!settings) settings = new Gamer.database.models.guild({ id: message.channel.guild.id }) as GuildSettings

  if (settings.language === personality.id)
    return message.channel.createMessage(language(`settings/setlanguage:ALREADY_ACTIVE`, { name: personality.name }))
  settings.language = personality.id
  settings.save()

  return message.channel.createMessage(language(`settings/setlanguage:SET`, { name: personality.name }))
})
