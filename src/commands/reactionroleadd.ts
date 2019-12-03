import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`reactionroleadd`, `rra`], async (message, args, context) => {
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

  const [name, emoji, ...roleIDsOrNames] = args
  if (!name || !emoji) return helpCommand.execute(message, [`reactionroleadd`], context)

  const validEmoji = await Gamer.database.models.emoji.findOne({ name: emoji.toLowerCase() })
  if (!validEmoji) return message.channel.createMessage(language(`emojis/emojicreate:NEED_VALID_EMOJI`))

  const roleIDs = message.roleMentions

  for (const roleIDOrName of roleIDsOrNames) {
    const role =
      message.channel.guild.roles.get(roleIDOrName) ||
      message.channel.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName.toLowerCase())
    if (!role || roleIDs.includes(role.id)) continue
    roleIDs.push(role.id)
  }

  // This checks if the user tried to add a role with a name which has a space in it
  const fullRoleName = roleIDsOrNames.join(' ').toLowerCase()
  const possibleRole = message.channel.guild.roles.find(r => r.name.toLowerCase() === fullRoleName)
  if (possibleRole && !roleIDs.includes(possibleRole.id)) roleIDs.push(possibleRole.id)

  if (!roleIDs.length) return helpCommand.execute(message, [`reactionrolecreate`], context)

  const reactionRole = await Gamer.database.models.reactionRole.findOne({
    name,
    guildID: message.channel.guild.id
  })

  if (!reactionRole) return message.channel.createMessage(language(`role/reactionroleadd:NOT_FOUND`, { name }))

  const reaction = Gamer.helpers.discord.convertEmoji(validEmoji.fullCode, `reaction`)
  if (!reaction) return

  reactionRole.reactions.push({
    reaction: reaction,
    roleIDs
  })

  reactionRole.save()

  const messageToUse = await Gamer.getMessage(reactionRole.channelID, reactionRole.messageID)
  if (!messageToUse) return

  messageToUse.addReaction(reaction)

  return message.channel.createMessage(language(`roles/reactionroleadd:UPDATED`, { name }))
})
