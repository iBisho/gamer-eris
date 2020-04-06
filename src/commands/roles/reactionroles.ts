import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command(`reactionroles`, async (message, _args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient

  const language = Gamer.getLanguage(message.guildID)
  const reactionroles = await Gamer.database.models.reactionRole.find({ guildID: message.guildID })
  if (!reactionroles.length) return message.channel.createMessage(language(`roles/reactionroles:NONE`))

  return Gamer.helpers.discord.embedResponse(
    message,
    reactionroles
      .map(
        (rr, index) =>
          `${index + 1}. ${rr.name} => ${rr.messageID} => ${rr.reactions.map(
            reaction => `${reaction.reaction} => ${reaction.roleIDs.map(id => `<@&${id}>`)}`
          )}`
      )
      .join('\n')
  )
})
