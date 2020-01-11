import Monitor from '../lib/structures/Monitor'
import { Message, PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    // If the message was not a mention of the bot cancel
    if (
      message.content !== Gamer.user.mention ||
      message.channel instanceof PrivateChannel ||
      message.channel instanceof GroupChannel
    )
      return

    const botPerms = message.channel.permissionsOf(Gamer.user.id)
    if (!botPerms.has('readMessages') || !botPerms.has('sendMessages')) return

    const language = Gamer.getLanguage(message.channel.guild.id)

    const prefix = Gamer.guildPrefixes.get(message.channel.guild.id) || Gamer.prefix
    return message.channel.createMessage(language(`common:MENTION_PREFIX`, { prefix }))
  }
}
