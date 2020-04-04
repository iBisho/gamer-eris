import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`reactionroleadd`, `rra`], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  const language = Gamer.getLanguage(message.guildID)

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name, emoji, ...roleIDsOrNames] = args
  if (!name || !emoji) return helpCommand.process(message, [`reactionroleadd`], context)

  const validEmoji = await Gamer.database.models.emoji.findOne({ name: emoji.toLowerCase() })
  if (!validEmoji) return message.channel.createMessage(language(`emojis/emojicreate:NEED_VALID_EMOJI`))

  const roleIDs = message.roleMentions

  for (const roleIDOrName of roleIDsOrNames) {
    const role =
      message.member.guild.roles.get(roleIDOrName) ||
      message.member.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName.toLowerCase())
    if (!role || roleIDs.includes(role.id)) continue
    roleIDs.push(role.id)
  }

  // This checks if the user tried to add a role with a name which has a space in it
  const fullRoleName = roleIDsOrNames.join(' ').toLowerCase()
  const possibleRole = message.member.guild.roles.find(r => r.name.toLowerCase() === fullRoleName)
  if (possibleRole && !roleIDs.includes(possibleRole.id)) roleIDs.push(possibleRole.id)

  if (!roleIDs.length) return helpCommand.process(message, [`reactionrolecreate`], context)

  const reactionRole = await Gamer.database.models.reactionRole.findOne({
    name,
    guildID: message.guildID
  })

  if (!reactionRole) return message.channel.createMessage(language(`roles/reactionroleadd:NOT_FOUND`, { name }))

  const reaction = Gamer.helpers.discord.convertEmoji(validEmoji.fullCode, `reaction`)
  if (!reaction) return

  reactionRole.reactions.push({
    reaction,
    roleIDs
  })

  await reactionRole.save()

  const reactionRoleChannel = message.member.guild.channels.get(reactionRole.channelID)
  if (!reactionRoleChannel) return

  const messageToUse = await Gamer.getMessage(reactionRoleChannel.id, reactionRole.messageID)
  if (!messageToUse) return

  messageToUse.addReaction(reaction)

  return message.channel.createMessage(language(`roles/reactionroleadd:UPDATED`, { name }))
})
