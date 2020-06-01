import Gamer from '..'
import { EventListener } from 'yuuko'

export default new EventListener('error', text => {
  if (Gamer.debugModeEnabled) Gamer.helpers.logger.debug(`ERROR EVENT: ${text}`)
})
