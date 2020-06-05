// This event is triggered once the bot is ready and online.
import Gamer from '../index'
import { MessageEmbed } from 'helperis'
import { EventListener } from 'yuuko'
import constants from '../constants'

export default new EventListener('shardReady', id => {
  if (Gamer.user.id !== constants.general.gamerID) return
  Gamer.helpers.logger.green(`[Shard READY] Shard ID ${id} is ready!`)
  const embed = new MessageEmbed().setColor(`#2ecc71`).setTitle(`Shard ${id} is ready`).setTimestamp()
  Gamer.createMessage(`680852595061162014`, { embed: embed.code })
})
