import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'

export default new Command(`setprefix`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  let guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null
  if (!guildSettings) guildSettings = new Gamer.database.models.guild({ id: message.channel.guild.id }) as GuildSettings

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return
  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  const [prefix] = args

  // If no prefix was provided reset it
  guildSettings.prefix = prefix ? prefix.substring(0, 2) : Gamer.prefix
  guildSettings.save()

  Gamer.guildPrefixes.set(message.channel.guild.id, prefix)

  return message.channel.createMessage(language(prefix ? `settings/setprefix:UPDATED` : `settings/setprefix:RESET`))
})
