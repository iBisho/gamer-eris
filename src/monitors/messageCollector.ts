import Monitor from '../lib/structures/Monitor'
import { Message } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    const collector = Gamer.collectors.get(message.author.id)
    // This user has no collectors pending or the message is in a different channel
    if (!collector || message.channel.id !== collector.channelID) return
    // This message is a response to a collector
    const callback = collector.callback

    // Delete the collector first
    Gamer.collectors.delete(message.author.id)
    // Run the callback for that collector
    callback(message, collector)
  }
}
