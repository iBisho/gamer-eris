import { Command } from 'yuuko'
import { promisify } from 'util'
import { exec } from 'child_process'
import Gamer from '../..'

const asyncExecute = promisify(exec)

export default new Command('update', async (message, args, context) => {
  if (message.author.id !== '130136895395987456') return

  const [type] = args
  switch (type) {
    case 'reload':
      await asyncExecute('git pull')
      const reloadCommand = Gamer.commandForName('reload')
      reloadCommand?.execute(message, [], context)
      break
    case 'npm':
      await asyncExecute('git pull && npm i && npm run build && pm2 restart gamer')
      message.channel.createMessage('Full update completed.')
    default:
      await asyncExecute('git pull && npm run build && pm2 restart gamer')
      message.channel.createMessage(
        'Git pulled, recompiled and restarted the bot. Bot should be starting up as we speak.'
      )
  }
})
