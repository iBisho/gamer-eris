// Logs that a command run (even if it was inhibited)
import { Message, PrivateChannel } from 'eris'
import Event from '../lib/structures/Event'
import { Command, CommandContext } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Event {
  async execute(command: Command, message: Message, args: string[], context: CommandContext) {
    const guildInfo =
      message.channel instanceof PrivateChannel ? `DM` : ` ${message.channel.guild.name} (${message.channel.guild.id}).`

    const Gamer = context.client as GamerClient

    Gamer.helpers.logger.blue(
      `${command.name.toUpperCase()} Command Ran by ${message.author.username} (${message.author.id}) in ${guildInfo}`
    )
    Gamer.helpers.logger.blue(`Args: ${args.length ? args : 'No args provided.'}`)
  }
}
