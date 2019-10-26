import config from '../config'
import GamerClient from './lib/structures/GamerClient'
import { Message, TextChannel, PrivateChannel } from 'eris'

const Gamer = new GamerClient({
  token: config.token,
  prefix: config.defaultPrefix,
  maxShards: `auto`,
  ignoreGlobalRequirements: false,
  getAllUsers: true
})

Gamer.globalCommandRequirements = {
  async custom(message: Message, _args, context) {
    if (!(message.channel as TextChannel).guild) return true
    let allowCommands = true
    await Promise.all(
      [...Gamer.monitors.values()].map(async monitor => {
        if (monitor.ignoreBots && message.author.bot) return
        if (monitor.ignoreDM && message.channel instanceof PrivateChannel) return
        if (monitor.ignoreEdits && message.editedTimestamp) return
        if (monitor.ignoreOthers && message.author.id !== context.client.user.id) return

        const result = await monitor.execute(message, Gamer)
        // If the result is truthy from the monitors cancel the commands for this message
        if (result) allowCommands = false
      })
    )

    return allowCommands
  }
}

Gamer.addCommandDir(`${__dirname}/commands`)
  .addDirectory(`${__dirname}/monitors`)
  .connect()

export default Gamer
