import Gamer from '../index'
import { MessageEmbed } from 'helperis'
import { EventListener } from 'yuuko'

export default new EventListener('shardResume', id => {
  Gamer.helpers.logger.debug(`[Shard RESUMED] Shard ID ${id} has been resumed.`)
  const embed = new MessageEmbed().setColor(`#3498db`).setTitle(`Shard ${id} has been resumed`).setTimestamp()
  Gamer.createMessage(`680852595061162014`, { embed: embed.code })
})
