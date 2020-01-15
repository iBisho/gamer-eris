import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`reactionroles`, async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const language = Gamer.getLanguage(message.channel.guild.id)
  const reactionroles = await Gamer.database.models.reactionRole.find({ guildID: message.channel.guild.id })
  if (!reactionroles.length) return message.channel.createMessage(language(`roles/reactionroles:NONE`))

  return Gamer.helpers.discord.embedResponse(
    message,
    reactionroles.map((rr, index) => `${index + 1}. ${rr.name} => ${rr.messageID}`).join('\n')
  )
})
