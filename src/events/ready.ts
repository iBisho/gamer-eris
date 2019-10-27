// This event is triggered once the bot is ready and online.
import Event from '../lib/structures/Event'
import Gamer from '../index'

export default class extends Event {
  async execute() {
    return Gamer.helpers.logger.green(`[READY] All shards should be ready now.`)
  }
}
