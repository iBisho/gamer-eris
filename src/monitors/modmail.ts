import Monitor from '../lib/structures/Monitor'
import { Message, PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    // If the message was not a mention of the bot cancel
    if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

    const supportChannelID = Gamer.guildSupportChannelIDs.get(message.channel.guild.id)
    if (!supportChannelID || supportChannelID !== message.channel.id) return

    const botPerms = message.channel.permissionsOf(Gamer.user.id)
    if (botPerms.has('manageMessages')) message.delete().catch(() => undefined)

    const mailCommand = Gamer.commandForName(`mail`)
    if (!mailCommand) return

    const prefix = Gamer.guildPrefixes.get(message.channel.guild.id) || Gamer.prefix
    // Run the mail command for this user
    mailCommand.execute(message, [message.content], { client: Gamer, commandName: `mail`, prefix })
  }
}
