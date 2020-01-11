import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`settenor`, async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const language = Gamer.getLanguage(message.channel.guild.id)

  const guildSettings =
    (await Gamer.database.models.guild.findOne({
      id: message.channel.guild.id
    })) || (await Gamer.database.models.guild.create({ id: message.channel.guild.id }))

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  let response = `settings/settenor:DISABLED`
  if (!guildSettings.disableTenor) Gamer.guildsDisableTenor.set(message.channel.guild.id, true)
  else {
    Gamer.guildsDisableTenor.delete(message.channel.guild.id)
    response = `settings/settenor:ENABLED`
  }

  guildSettings.disableTenor = !guildSettings.disableTenor
  guildSettings.save()

  return message.channel.createMessage(language(response))
})
