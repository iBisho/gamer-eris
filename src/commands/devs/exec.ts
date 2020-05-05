import { Command } from 'yuuko'
import { promisify } from 'util'
import { exec } from 'child_process'

const asyncExecute = promisify(exec)

export default new Command('exec', async (message, args) => {
  if (message.author.id !== '130136895395987456') return

  await asyncExecute(args.join(' '))
})
