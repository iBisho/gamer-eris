import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`tagshow`, `ts`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.guildID)
  const [name] = args
  if (!name) return helpCommand.process(message, [`tagshow`], context)

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  // If the user is not an admin cancel out
  if (
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID) &&
    !Gamer.helpers.discord.isModerator(message, guildSettings?.staff.modRoleIDs)
  )
    return

  const tagName = name.toLowerCase()

  const tag = await Gamer.database.models.tag.findOne({
    guildID: message.guildID,
    name: tagName
  })

  if (!tag) return message.channel.createMessage(language(`tags/tagshow:INVALID_NAME`, { name }))
  return message.channel.createMessage(['```json', tag?.embedCode, '```'].join('\n'))
})
