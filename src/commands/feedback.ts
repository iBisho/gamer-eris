import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`feedback`, `fb`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient

  const [name] = args
  if (!name) return

  if (![`idea`, `bugs`].includes(name.toLowerCase())) return

  const command = Gamer.commandForName(name.toLowerCase())
  if (!command) return
  args.shift()

  command.process(message, args, context)
})
