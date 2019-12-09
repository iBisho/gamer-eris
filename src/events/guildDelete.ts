import Event from '../lib/structures/Event'
import { Guild } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Event {
  async execute(guild: Guild) {
    const Gamer = guild.shard.client as GamerClient

    Gamer.amplitude.push({
      authorID: guild.ownerID,
      guildID: guild.id,
      timestamp: Date.now(),
      type: 'GUILD_REMOVED'
    })
  }
}
