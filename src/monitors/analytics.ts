import Monitor from '../lib/structures/Monitor'
import { Message } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    // If message is not in a guild we can simply cancel out
    if (!message.member) return

    // Analytics is a VIP feature
    const isVIP = Gamer.vipGuildIDs.has(message.member.guild.id)
    if (!isVIP) return

    Gamer.database.models.analytics.create({
      guildID: message.member.guild.id,
      userID: message.member.id,
      messageID: message.id,
      channelID: message.channel.id,
      timestamp: message.timestamp,
      type: 'MESSAGE_CREATE'
    })
  }
}
