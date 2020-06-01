import Gamer from '..'
import { EventListener } from 'yuuko'

export default new EventListener('debug', text => {
  // Normal requests that arent rate limited at all
  if (text.endsWith('(0ms left)')) return

  if (Gamer.debugModeEnabled) Gamer.helpers.logger.debug(text)

  if (text.includes('Global')) console.log(text)
})
