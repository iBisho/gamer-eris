import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`reactionroleremove`, `rrr`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return
  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name, emoji] = args
  if (!name || !emoji) return helpCommand.process(message, [`reactionroleremove`], context)

  const validEmoji = await Gamer.database.models.emoji.findOne({ name: emoji.toLowerCase() })
  if (!validEmoji) return message.channel.createMessage(language(`emojis/emojicreate:NEED_VALID_EMOJI`))

  const reactionRole = await Gamer.database.models.reactionRole.findOne({
    name,
    guildID: message.channel.guild.id
  })

  if (!reactionRole) return message.channel.createMessage(language(`role/reactionroleadd:NOT_FOUND`, { name }))

  const reaction = Gamer.helpers.discord.convertEmoji(validEmoji.fullCode, `reaction`)
  if (!reaction) return

  reactionRole.reactions = reactionRole.reactions.filter(r => r.reaction !== reaction)
  reactionRole.save()

  return message.channel.createMessage(language(`roles/reactionroleadd:UPDATED`, { name }))
})
