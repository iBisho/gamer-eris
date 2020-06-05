import Gamer from '../index'
import { MessageEmbed } from 'helperis'
import { EventListener } from 'yuuko'
import constants from '../constants/index'
export default new EventListener('shardDisconnect', (error, id) => {
  if (Gamer.user.id !== constants.general.gamerID) return

  Gamer.helpers.logger.debug(`[Shard DISCONNECT] Shard ID ${id} disconnected.`)
  const embed = new MessageEmbed()
    .setColor(`#e74c3c`)
    .setTitle(`Shard ${id} has been disconnected`)
    .setDescription(`${error?.stack || 'Unknown Reason'}`)
    .setTimestamp()
  Gamer.createMessage(`680852595061162014`, { embed: embed.code })
})
