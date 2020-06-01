import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { TextChannel, NewsChannel } from 'eris'

export default new Command([`reactionroleremove`, `rrr`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })

  const language = Gamer.getLanguage(message.guildID)

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name, emoji] = args
  if (!name || !emoji) return helpCommand?.execute(message, [`reactionroleremove`], { ...context, commandName: 'help' })

  const validEmoji = await Gamer.database.models.emoji.findOne({ name: emoji.toLowerCase() })
  if (!validEmoji) return message.channel.createMessage(language(`emojis/emojicreate:NEED_VALID_EMOJI`))

  const reactionRole = await Gamer.database.models.reactionRole.findOne({
    name: name.toLowerCase(),
    guildID: message.guildID
  })

  if (!reactionRole) return message.channel.createMessage(language(`role/reactionroleadd:NOT_FOUND`, { name }))

  const reaction = Gamer.helpers.discord.convertEmoji(validEmoji.fullCode, `reaction`)
  if (!reaction) return

  reactionRole.reactions = reactionRole.reactions.filter(r => r.reaction !== reaction)
  reactionRole.save()

  const channel = message.member?.guild.channels.get(reactionRole.channelID)
  if (
    channel &&
    (channel instanceof TextChannel || channel instanceof NewsChannel) &&
    Gamer.helpers.discord.checkPermissions(channel, Gamer.user.id, [
      `readMessages`,
      `sendMessages`,
      `readMessageHistory`,
      `manageMessages`
    ])
  ) {
    const reactionRoleMessage = await Gamer.getMessage(reactionRole.channelID, reactionRole.messageID).catch(
      () => undefined
    )
    if (reactionRoleMessage) {
      reactionRoleMessage.removeMessageReactionEmoji(`${validEmoji.name}:${validEmoji.id}`)
    }
  }

  return message.channel.createMessage(language(`roles/reactionroleadd:UPDATED`, { name }))
})
