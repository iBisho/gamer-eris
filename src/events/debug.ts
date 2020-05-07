import Event from '../lib/structures/Event'
import Gamer from '..'

export default class extends Event {
  async execute(text: string) {
    // Normal requests that arent rate limited at all
    if (text.endsWith('(0ms left)')) return

    if (Gamer.debugModeEnabled) Gamer.helpers.logger.debug(text)

    if (text.includes('Global')) console.log(text)
  }
}
