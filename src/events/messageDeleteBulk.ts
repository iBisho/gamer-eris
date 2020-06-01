import Gamer from '..'
import { EventListener } from 'yuuko'

export default new EventListener('messageDeleteBulk', messages => {
  for (const message of messages) Gamer.emit('messageDelete', message)
})
