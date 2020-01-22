import Monitor from '../lib/structures/Monitor'
import { Message } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    if (!message.guildID) return

    // If the message was not a mention of the bot cancel
    if (message.content !== Gamer.user.mention && message.content !== `<@!${Gamer.user.id}>`) return

    const hasPermission = Gamer.helpers.discord.checkPermissions(message.channel, Gamer.user.id, [
      `readMessages`,
      `sendMessages`
    ])
    if (!hasPermission) return

    const language = Gamer.getLanguage(message.guildID)
    const prefix = Gamer.guildPrefixes.get(message.guildID) || Gamer.prefix
    return message.channel.createMessage(language(`common:MENTION_PREFIX`, { prefix }))
  }
}
