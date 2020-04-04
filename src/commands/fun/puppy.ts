import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'

export default new Command([`puppy`, `dog`, `doggo`], async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  return Gamer.helpers.tenor.randomGif(message, `puppy`, constants.gifs.puppy, false)
})
