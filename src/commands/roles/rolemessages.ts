import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command(`rolemessages`, async (message, _args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient

  const language = Gamer.getLanguage(message.guildID)
  const roleMessages = await Gamer.database.models.roleMessages.find({ guildID: message.guildID })
  if (!roleMessages.length) return message.channel.createMessage(language(`roles/rolemessages:NONE`))

  return Gamer.helpers.discord.embedResponse(
    message,
    roleMessages
      .map(
        (rr, index) =>
          `${index + 1}. <@&${rr.roleID}> <#${rr.channelID}> **${Gamer.helpers.discord.booleanEmoji(rr.roleAdded)}**`
      )
      .join('\n')
  )
})
