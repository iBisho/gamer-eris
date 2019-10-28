// This event is triggered once the bot is ready and online.
import Event from '../lib/structures/Event'
import Gamer from '../index'
import { GuildSettings } from '../lib/types/settings'

export default class extends Event {
  async execute() {
    setInterval(() => {
      const promises = [...Gamer.collectors.values()].map(async collector => {
        // Fetch this guilds settings
        const guildSettings = (await Gamer.database.models.guild.findOne({
          id: collector.guildID
        })) as GuildSettings | null
        // How many minutes to wait for a response for the collectors in this guild. VIP Guilds can change the time
        const menutime = guildSettings ? guildSettings.menutime : 2
        // If the collector had no response in X minutes delete the collector
        if (Date.now() - collector.createdAt > 60000 * menutime) Gamer.collectors.delete(collector.authorID)
      })

      Promise.all(promises)
    })
    return Gamer.helpers.logger.green(`[READY] All shards completely ready now.`)
  }
}
