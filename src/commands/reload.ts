import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import i18next from 'i18next'
import constants from '../constants'
import { promisify } from 'util'
import { exec } from 'child_process'

const asyncExecute = promisify(exec)

export default new Command('reload', async (message, _args, context) => {
  if (message.author.id !== '130136895395987456') return
  const Gamer = context.client as GamerClient

  // First recompile the files
  await asyncExecute('npm run build')
  // Reloads commands
  Gamer.reloadCommands()
  // Reloads all the stores
  Gamer.reloadDirectory('monitors', Gamer.monitors)
  Gamer.reloadDirectory('events', Gamer.events)
  // Reloads i18n translations
  i18next.reloadResources(constants.personalities.map(p => p.id))

  message.channel.createMessage('Reloaded.')
})
