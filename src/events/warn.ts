import { EventListener } from 'yuuko'
import Gamer from '..'

export default new EventListener('warn', text => {
  if (Gamer.debugModeEnabled) Gamer.helpers.logger.debug(`WARN EVENT: ${text}`)
})
