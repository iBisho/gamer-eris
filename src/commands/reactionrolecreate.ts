import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'

export default new Command([`reactionrolecreate`, `rrc`], async (message, args, context) => {
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

  const [messageID, name, emoji, ...roleIDsOrNames] = args
  if (!messageID || !name || !emoji) return helpCommand.execute(message, [`reactionrolecreate`], context)

  const messageToUse =
    message.channel.messages.get(messageID) || (await Gamer.getMessage(message.channel.id, messageID))

  const validEmoji = Gamer.helpers.discord.convertEmoji(emoji, `data`)
  if (!validEmoji) return message.channel.createMessage(language(`community/emojicreate:NEED_VALID_EMOJI`))

  const roleIDs = []

  for (const roleIDOrName of [...message.roleMentions, ...roleIDsOrNames]) {
    const role =
      message.channel.guild.roles.get(roleIDOrName) ||
      message.channel.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName.toLowerCase())
    if (!role) continue
    roleIDs.push(role.id)
  }

  if (!roleIDs.length) return helpCommand.execute(message, [`reactionrolecreate`], context)

  const reactionRole = await Gamer.database.models.reactionRole.findOne({
    name,
    guildID: message.channel.guild.id
  })

  if (reactionRole) return message.channel.createMessage(language(`role/reactionrolecreate:NAME_EXISTS`, { name }))

  const reaction = `${validEmoji.name}:${validEmoji.id}`

  new Gamer.database.models.reactionRole({
    name,
    reactions: [
      {
        reaction,
        roleIDs
      }
    ],
    messageID: messageToUse.id,
    channelID: messageToUse.channel.id,
    guildID: message.channel.guild.id,
    authorID: message.author.id
  })

  messageToUse.addReaction(reaction)

  return message.channel.createMessage(language(`roles/reactionrolecreate:CREATED`, { name }))
})
