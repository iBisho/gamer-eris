import { Message } from 'eris'
import Event from '../lib/structures/Event'
import { Command, CommandContext } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Event {
  async execute(_command: Command, message: Message, _args: string[], context: CommandContext) {
    const Gamer = context.client as GamerClient

    Gamer.slowmode.set(message.author.id, message.timestamp)
  }
}
