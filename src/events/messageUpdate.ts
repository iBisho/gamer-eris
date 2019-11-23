import Event from '../lib/structures/Event'
import { PrivateChannel, Message } from 'eris'
import Gamer from '..'
import { PartialMessage } from '../lib/types/discord'

export default class extends Event {
  async execute(message: Message | PartialMessage) {
    if (message.channel instanceof PrivateChannel) return
    // Valid message object so we can simply run the monitors
    if (message instanceof Message) return Gamer.runMonitors(message)
    // Since we only have a partial message because the edited message was uncached we need to fetch it
    const messageToProcess = await message.channel.getMessage(message.id)
    Gamer.runMonitors(messageToProcess)
  }
}
