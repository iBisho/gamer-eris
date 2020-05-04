import Event from '../lib/structures/Event'
import Gamer from '..'

export default class extends Event {
  async execute(text: string) {
    if (Gamer.debugModeEnabled) Gamer.helpers.logger.debug(text)
    // console.warn('debug event', text)
    if (text.includes('Global')) console.log(text)
  }
}
