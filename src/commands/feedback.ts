import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'

export default new Command([`feedback`, `fb`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const [name] = args
  if (![`idea`, `bugs`].includes(name.toLowerCase())) return

  const command = Gamer.commandForName(name.toLowerCase())
  if (!command) return
  args.shift()

  command.execute(message, args, context)
})
