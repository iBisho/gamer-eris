import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'
import { GamerReactionRole } from '../lib/types/gamer'

export default new Command([`reactionroledelete`, `rrd`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return
  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name, emoji] = args
  if (!name || !emoji) return helpCommand.execute(message, [`reactionroledelete`], context)

  const validEmoji = Gamer.helpers.discord.convertEmoji(emoji, `data`)
  if (!validEmoji) return message.channel.createMessage(language(`community/emojicreate:NEED_VALID_EMOJI`))

  const reactionRole = (await Gamer.database.models.reactionRole.findOne({
    name,
    guildID: message.channel.guild.id
  })) as GamerReactionRole | null

  if (!reactionRole) return message.channel.createMessage(language(`role/reactionroleadd:NOT_FOUND`, { name }))

  Gamer.database.models.reactionRole.deleteOne({ name, guildID: message.channel.guild.id })

  return message.channel.createMessage(language(`roles/reactionroledelete:DELETED`, { name }))
})
