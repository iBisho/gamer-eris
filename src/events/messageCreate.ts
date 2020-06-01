import { EventListener } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'

export default new EventListener('messageCreate', (message, context) => {
  const Gamer = context.client as GamerClient

  // Run all monitors on this message
  for (const monitor of Gamer.monitors.values()) {
    if (monitor.ignoreBots && message.author.bot) continue
    if (monitor.ignoreDM && message.channel instanceof PrivateChannel) continue
    if (monitor.ignoreEdits && message.editedTimestamp) continue
    if (monitor.ignoreOthers && message.author.id !== Gamer.user.id) continue

    monitor.execute(message, Gamer)
  }

  // Ignore bots commands
  if (message.author.bot) return

  // Process the command
  Gamer.processCommand(message)
})
