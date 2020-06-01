import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { TextChannel, NewsChannel } from 'eris'

export default new Command([`reactionroledelete`, `rrd`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  const language = Gamer.getLanguage(message.guildID)

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name] = args
  if (!name) return helpCommand.execute(message, [`reactionroledelete`], { ...context, commandName: 'help' })

  const reactionRole = await Gamer.database.models.reactionRole.findOne({
    name: name.toLowerCase(),
    guildID: message.guildID
  })

  if (!reactionRole) return message.channel.createMessage(language(`role/reactionroleadd:NOT_FOUND`, { name }))

  Gamer.database.models.reactionRole.deleteOne({ name: name.toLowerCase(), guildID: message.guildID }).exec()

  const channel = message.member.guild.channels.get(reactionRole.channelID)
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
      reactionRoleMessage.removeReactions()
    }
  }

  return message.channel.createMessage(language(`roles/reactionroledelete:DELETED`, { name }))
})
