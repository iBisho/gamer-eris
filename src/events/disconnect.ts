import Event from '../lib/structures/Event'
import Gamer from '../index'
import { MessageEmbed } from 'helperis'

export default class extends Event {
  async execute() {
    Gamer.helpers.logger.debug(`[Shards DISCONNECTED] All shards are disconnected.`)
    const embed = new MessageEmbed()
      .setColor(`#e67e22`)
      .setTitle(`All shards disconnected`)
      .setTimestamp()
    Gamer.createMessage(`680852595061162014`, { embed: embed.code })
  }
}
