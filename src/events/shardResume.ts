import Event from '../lib/structures/Event'
import Gamer from '../index'
import { MessageEmbed } from 'helperis'

export default class extends Event {
  async execute(id: number) {
    Gamer.helpers.logger.green(`[Shard RESUMED] Shard ID ${id} has been resumed.`)
    const embed = new MessageEmbed()
      .setColor(`#3498db`)
      .setTitle(`Shard ${id} has been resumed`)
      .setTimestamp()
    Gamer.createMessage(`680852595061162014`, { embed: embed.code })
  }
}
