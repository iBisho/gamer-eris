import config from '../config'
import GamerClient from './lib/structures/GamerClient'

const Gamer = new GamerClient({
  token: config.token,
  prefix: config.defaultPrefix,
  maxShards: `auto`
})

Gamer.addCommandDir(`${__dirname}/commands`).connect()

export default Gamer
