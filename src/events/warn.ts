import Event from '../lib/structures/Event'
import Gamer from '..'

export default class extends Event {
  async execute(text: string) {
    if (Gamer.debugModeEnabled) Gamer.helpers.logger.debug(`WARN EVENT: ${text}`)
  }
}
