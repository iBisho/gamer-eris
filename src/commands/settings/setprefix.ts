import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { upsertGuild } from '../../database/mongoHandler'

export default new Command(`setprefix`, async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const guildSettings = await upsertGuild(message.guildID)

  const language = Gamer.getLanguage(message.guildID)

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  const [prefix] = args

  // If no prefix was provided reset it
  guildSettings.prefix = prefix ? prefix.substring(0, 2) : Gamer.prefix
  guildSettings.save()

  Gamer.guildPrefixes.set(message.guildID, prefix)

  return message.channel.createMessage(language(prefix ? `settings/setprefix:UPDATED` : `settings/setprefix:RESET`))
})
