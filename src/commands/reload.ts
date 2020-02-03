import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import i18next from 'i18next'
import constants from '../constants'
import { promisify } from 'util'
import { exec } from 'child_process'

const asyncExecute = promisify(exec)

export default new Command('reload', async (message, args, context) => {
  if (message.author.id !== '130136895395987456') return
  const Gamer = context.client as GamerClient

  // First recompile the files
  if (!args.length || !args.includes('skip')) await asyncExecute('npm run build')

  // Remove skip from args
  if (args.includes('skip')) args = args.filter(a => a !== 'skip')

  // Reloads commands
  if (!args.length || args.includes('commands')) Gamer.reloadCommands()
  // Reloads all the stores
  if (!args.length || args.includes('monitors')) Gamer.reloadDirectory('monitors', Gamer.monitors)
  if (!args.length || args.includes('events')) {
    // First remove all existing event listeneres
    Gamer.events.forEach(e => Gamer.removeListener(e.name, e.execute.bind(e)))
    Gamer.reloadDirectory('events', Gamer.events)
    // Add the events listeners back
    Gamer.events.forEach(e => Gamer.on(e.name, e.execute.bind(e)))
  }
  // Reloads i18n translations
  if (!args.length || args.includes('languages')) i18next.reloadResources(constants.personalities.map(p => p.id))

  message.channel.createMessage(`Reloaded. ${args}`)
})
