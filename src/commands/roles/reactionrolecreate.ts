import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`reactionrolecreate`, `rrc`], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.member.guild.id)

  const hasPermissions = Gamer.helpers.discord.checkPermissions(message.channel, Gamer.user.id, [
    `addReactions`,
    `externalEmojis`,
    `readMessageHistory`
  ])

  if (!hasPermissions) return message.channel.createMessage(language(`roles/reactionrolecreate:NEED_PERMS`))

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.member.guild.id })
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [messageID, name, emoji, ...roleIDsOrNames] = args

  if (messageID === 'setup') {
    return Gamer.helpers.scripts.createReactionRoleColors(message)
  }

  if (!messageID || !name || !emoji)
    return helpCommand.execute(message, [`reactionrolecreate`], { ...context, commandName: 'help' })

  const messageToUse =
    message.channel.messages.get(messageID) || (await message.channel.getMessage(messageID).catch(() => undefined))
  if (!messageToUse) return helpCommand.execute(message, [`reactionrolecreate`], { ...context, commandName: 'help' })

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

  if (!roleIDs.length) return helpCommand.execute(message, [`reactionrolecreate`], { ...context, commandName: 'help' })

  const reactionRole = await Gamer.database.models.reactionRole.findOne().or([
    {
      name: name.toLowerCase(),
      guildID: message.member.guild.id
    },
    { messageID }
  ])

  if (reactionRole) return message.channel.createMessage(language(`roles/reactionrolecreate:NAME_EXISTS`, { name }))

  const reaction = Gamer.helpers.discord.convertEmoji(validEmoji.fullCode, `reaction`)
  if (!reaction) return

  await Gamer.database.models.reactionRole.create({
    name: name.toLowerCase(),
    reactions: [
      {
        reaction,
        roleIDs
      }
    ],
    messageID: messageToUse.id,
    channelID: messageToUse.channel.id,
    guildID: message.member.guild.id,
    authorID: message.author.id
  })

  messageToUse.addReaction(reaction)

  return message.channel.createMessage(language(`roles/reactionrolecreate:CREATED`, { name }))
})
