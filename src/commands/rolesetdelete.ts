import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'

export default new Command([`rolesetdelete`, `rsd`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : `en-US`)
  if (!language) return
  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name] = args
  if (!name) return helpCommand.execute(message, [`rolesetcreate`], context)

  const deleted = await Gamer.database.models.roleset.findOneAndDelete({
    guildID: message.channel.guild.id,
    name
  })
  if (!deleted) return message.channel.createMessage(language(`roles/rolesetdelete:INVALID_NAME`))

  return message.channel.createMessage(language(`roles/rolesetdelete:DELETED`))
})
