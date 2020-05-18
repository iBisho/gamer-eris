import Event from '../lib/structures/Event'
import Gamer from '../index'
import { MessageEmbed } from 'helperis'

export default class extends Event {
  async execute(error: Error | undefined, id: number) {
    Gamer.helpers.logger.green(`[Shard DISCONNECT] Shard ID ${id} disconnected.`)
    const embed = new MessageEmbed()
      .setColor(`#e74c3c`)
      .setTitle(`Shard ${id} has been disconnected`)
      .setDescription(`${error?.stack || 'Unknown Reason'}`)
      .setTimestamp()
    Gamer.createMessage(`680852595061162014`, { embed: embed.code })
  }
}
