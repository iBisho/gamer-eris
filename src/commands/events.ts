import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'

export default new Command([`events`, `event`, `e`], async (message, _args, context) => {
  if (message.channel instanceof PrivateChannel || !message.member) return

  const Gamer = context.client as GamerClient
  console.log(Gamer.user.id)
})
