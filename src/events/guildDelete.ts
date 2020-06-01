import GamerClient from '../lib/structures/GamerClient'
import { EventListener } from 'yuuko'

export default new EventListener('guildDelete', guild => {
  // Sometimes discord api doesnt send the guildcreate so this can be broken
  if (!guild) return

  const Gamer = guild.shard.client as GamerClient

  Gamer.amplitude.push({
    authorID: guild.ownerID,
    guildID: guild.id,
    timestamp: Date.now(),
    type: 'GUILD_REMOVED'
  })
})
