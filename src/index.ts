import config from '../config'
import GamerClient from './lib/structures/GamerClient'

const Gamer = new GamerClient({
  token: config.token,
  prefix: config.defaultPrefix,
  maxShards: `auto`,
  ignoreGlobalRequirements: false,
  getAllUsers: true,
  disableEvents: {
    CHANNEL_PINS_UPDATE: true,
    GUILD_UPDATE: true,
    GUILD_INTEGRATIONS_UPDATE: true,
    PRESENCE_UPDATE: true,
    TYPING_START: true,
    USER_UPDATE: true,
    WEBHOOKS_UPDATE: true
  }
})

Gamer.addCommandDir(`${__dirname}/commands`)
  .addDirectory(`${__dirname}/monitors`)
  .addDirectory(`${__dirname}/events`)
  .connect()

// bind so the `this` is relevent to the event
for (const [name, event] of Gamer.events) Gamer.on(name, event.execute.bind(event))
export default Gamer
