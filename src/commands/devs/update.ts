import { Command } from 'yuuko'
import { promisify } from 'util'
import { exec } from 'child_process'

const asyncExecute = promisify(exec)

export default new Command('update', async message => {
  if (message.author.id !== '130136895395987456') return

  await asyncExecute('git pull && npm run build && pm2 restart gamer')

  message.channel.createMessage('Git pulled, recompiled and restarted the bot. Bot should be starting up as we speak.')
})
