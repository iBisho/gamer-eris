// This event is triggered once the bot is ready and online.
import Event from '../lib/structures/Event'
import Gamer from '../index'

export default class extends Event {
  async execute(id: number) {
    Gamer.helpers.logger.green(`[Shard READY] Shard ID ${id} is ready!`)
  }
}
