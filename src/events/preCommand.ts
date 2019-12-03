// Logs that a command run (even if it was inhibited)
import { Message, PrivateChannel, GroupChannel } from 'eris'
import Event from '../lib/structures/Event'
import { Command, CommandContext } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Event {
  async execute(command: Command, message: Message, args: string[], context: CommandContext) {
    const guildInfo =
      message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel
        ? `DM`
        : ` ${message.channel.guild.name} (${message.channel.guild.id}).`

    const Gamer = context.client as GamerClient

    Gamer.helpers.logger.blue(
      `${command.name.toUpperCase()} Command Ran by ${message.author.username} (${message.author.id}) in ${guildInfo}`
    )
    Gamer.helpers.logger.blue(`Args: ${args.length ? args : 'No args provided.'}`)

    if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

    Gamer.amplitude.push({
      authorID: message.author.id,
      channelID: message.channel.id,
      guildID: message.channel.guild.id,
      messageID: message.id,
      timestamp: message.timestamp,
      commandName: command.name,
      type: 'COMMAND_RAN'
    })

    // Return a random number between 2 and 10 points for special commands
    const xpForCommand = [`eventsjoin`, `profile`, `background`, `capture`].includes(command.name)
      ? Math.floor(Math.random() * (10 - 2 + 1) + 2)
      : 1

    Gamer.helpers.levels.addLocalXP(message.member, xpForCommand)
    Gamer.helpers.levels.addGlobalXP(message.member, xpForCommand)
  }
}
