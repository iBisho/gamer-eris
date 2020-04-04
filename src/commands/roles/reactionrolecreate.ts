import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`reactionrolecreate`, `rrc`], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.guildID)

  const hasPermissions = Gamer.helpers.discord.checkPermissions(message.channel, Gamer.user.id, [
    `addReactions`,
    `externalEmojis`,
    `readMessageHistory`
  ])

  if (!hasPermissions) return message.channel.createMessage(language(`roles/reactionrolecreate:NEED_PERMS`))

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [messageID, name, emoji, ...roleIDsOrNames] = args
  if (!messageID || !name || !emoji) return helpCommand.process(message, [`reactionrolecreate`], context)

  const messageToUse =
    message.channel.messages.get(messageID) || (await message.channel.getMessage(messageID).catch(() => undefined))
  if (!messageToUse) return helpCommand.process(message, [`reactionrolecreate`], context)

  const validEmoji = await Gamer.database.models.emoji.findOne({
    name: emoji.toLowerCase()
  })

  if (!validEmoji) return message.channel.createMessage(language(`emojis/emojicreate:NEED_VALID_EMOJI`))

  const roleIDs = message.roleMentions

  for (const roleIDOrName of roleIDsOrNames) {
    const role =
      message.member.guild.roles.get(roleIDOrName) ||
      message.member.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName.toLowerCase())
    if (!role) continue
    roleIDs.push(role.id)
  }

  if (!roleIDs.length) return helpCommand.process(message, [`reactionrolecreate`], context)

  const reactionRole = await Gamer.database.models.reactionRole.findOne().or([
    {
      name,
      guildID: message.guildID
    },
    { messageID }
  ])

  if (reactionRole) return message.channel.createMessage(language(`roles/reactionrolecreate:NAME_EXISTS`, { name }))

  const reaction = Gamer.helpers.discord.convertEmoji(validEmoji.fullCode, `reaction`)
  if (!reaction) return

  await Gamer.database.models.reactionRole.create({
    name,
    reactions: [
      {
        reaction,
        roleIDs
      }
    ],
    messageID: messageToUse.id,
    channelID: messageToUse.channel.id,
    guildID: message.guildID,
    authorID: message.author.id
  })

  messageToUse.addReaction(reaction)

  return message.channel.createMessage(language(`roles/reactionrolecreate:CREATED`, { name }))
})
