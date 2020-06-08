import Gamer from '../index'
import { MessageEmbed } from 'helperis'
import { EventListener } from 'yuuko'
import constants from '../constants'

export default new EventListener('disconnect', () => {
  Gamer.helpers.logger.debug(`[Shards DISCONNECTED] All shards are disconnected.`)
  const embed = new MessageEmbed().setColor(`#e67e22`).setTitle(`All shards disconnected`).setTimestamp()
  if (Gamer?.user.id === constants.general.gamerID) Gamer.createMessage(`680852595061162014`, { embed: embed.code })
})
