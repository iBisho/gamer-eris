import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import constants from '../constants'

export default new Command(`pat`, async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  Gamer.helpers.tenor.randomGif(message, 'pat', constants.gifs.pat)
})
