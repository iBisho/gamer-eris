import Monitor from '../lib/structures/Monitor'
import { Message, PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Monitor {
  ignoreBots = false
  async execute(message: Message, Gamer: GamerClient) {
    // Save this message in the amplitude events
    Gamer.amplitude.push({
      authorID: message.author.id,
      channelID: message.channel.id,
      guildID:
        message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel
          ? `DM`
          : message.channel.guild.id,
      messageID: message.id,
      timestamp: message.timestamp,
      type: 'MESSAGE_CREATE'
    })

    // Run the processXP event since a message was sent
    if (!message.author.bot) Gamer.emit('processXP', message, Gamer)
  }
}
