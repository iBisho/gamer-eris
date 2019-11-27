import Event from '../lib/structures/Event'
import { Guild } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Event {
  async execute(guild: Guild) {
    const Gamer = guild.shard.client as GamerClient

    // Contact all Server Managers
    // Fetch all guild members since we don't cache them
    Gamer.helpers.logger.green(`Gamer has left a guild: ${guild.name} with ${guild.members.size} members.`)

    Gamer.amplitude.push({
      authorID: guild.ownerID,
      guildID: guild.id,
      timestamp: Date.now(),
      type: 'GUILD_REMOVED'
    })
  }
}
