import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command(`settenor`, async (message, _args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const guildSettings =
    (await Gamer.database.models.guild.findOne({
      id: message.guildID
    })) || (await Gamer.database.models.guild.create({ id: message.guildID }))

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  let response = `settings/settenor:DISABLED`
  if (!guildSettings.disableTenor) Gamer.guildsDisableTenor.set(message.guildID, true)
  else {
    Gamer.guildsDisableTenor.delete(message.guildID)
    response = `settings/settenor:ENABLED`
  }

  guildSettings.disableTenor = !guildSettings.disableTenor
  guildSettings.save()

  return message.channel.createMessage(language(response))
})
