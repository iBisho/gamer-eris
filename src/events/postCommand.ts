import { EventListener } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new EventListener('postCommand', (_command, message, _args, context) => {
  const Gamer = context.client as GamerClient

  Gamer.slowmode.set(message.author.id, message.timestamp)
})
