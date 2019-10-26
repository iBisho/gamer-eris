import config from '../config'
import GamerClient from './lib/structures/GamerClient'

const Gamer = new GamerClient({
  token: config.token,
  prefix: config.defaultPrefix,
  maxShards: `auto`,
  ignoreGlobalRequirements: false,
  getAllUsers: true
})

Gamer.addCommandDir(`${__dirname}/commands`)
  .addDirectory(`${__dirname}/monitors`)
  .addDirectory(`${__dirname}/events`)
  .connect()

for (const [name, event] of Gamer.events) Gamer.on(name, event.execute)
export default Gamer
