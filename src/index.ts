import { Client } from 'yuuko'
import config from '../config'

const Gamer = new Client({
  token: config.token,
  prefix: config.defaultPrefix,
  maxShards: `auto`
})

Gamer.addCommandDir(`${__dirname}/commands`).connect()

export default Gamer
