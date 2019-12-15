import Event from '../lib/structures/Event'
import { PossiblyUncachedMessage } from 'eris'
import Gamer from '..'

export default class extends Event {
  async execute(messages: PossiblyUncachedMessage[]) {
    for (const message of messages) Gamer.emit('messageDelete', message)
  }
}
