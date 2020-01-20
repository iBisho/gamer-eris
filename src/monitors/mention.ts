import Monitor from '../lib/structures/Monitor'
import { Message, GuildTextableChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    // If the message was not a mention of the bot cancel
    if (message.content !== Gamer.user.mention || !message.guildID) return

    const botPerms = (message.channel as GuildTextableChannel).permissionsOf(Gamer.user.id)
    if (!botPerms.has('readMessages') || !botPerms.has('sendMessages')) return

    const language = Gamer.getLanguage(message.guildID)

    const prefix = Gamer.guildPrefixes.get(message.guildID) || Gamer.prefix
    return message.channel.createMessage(language(`common:MENTION_PREFIX`, { prefix }))
  }
}
