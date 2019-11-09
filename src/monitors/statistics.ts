import Monitor from '../lib/structures/Monitor'
import { Message, PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    Gamer.amplitude.push({
      authorID: message.author.id,
      channelID: message.channel.id,
      guildID: message.channel instanceof PrivateChannel ? `DM` : message.channel.guild.id,
      messageID: message.id,
      timestamp: message.timestamp,
      type: 'MESSAGE_CREATE'
    })
  }
}
