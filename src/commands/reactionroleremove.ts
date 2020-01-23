import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`reactionroleremove`, `rrr`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  const language = Gamer.getLanguage(message.guildID)

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name, emoji] = args
  if (!name || !emoji) return helpCommand.process(message, [`reactionroleremove`], context)

  const validEmoji = await Gamer.database.models.emoji.findOne({ name: emoji.toLowerCase() })
  if (!validEmoji) return message.channel.createMessage(language(`emojis/emojicreate:NEED_VALID_EMOJI`))

  const reactionRole = await Gamer.database.models.reactionRole.findOne({
    name,
    guildID: message.guildID
  })

  if (!reactionRole) return message.channel.createMessage(language(`role/reactionroleadd:NOT_FOUND`, { name }))

  const reaction = Gamer.helpers.discord.convertEmoji(validEmoji.fullCode, `reaction`)
  if (!reaction) return

  reactionRole.reactions = reactionRole.reactions.filter(r => r.reaction !== reaction)
  reactionRole.save()

  return message.channel.createMessage(language(`roles/reactionroleadd:UPDATED`, { name }))
})
