import Monitor from '../lib/structures/Monitor'
import { Message, GuildTextableChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    // If the message was not a mention of the bot cancel
    if (!message.guildID) return

    const supportChannelID = Gamer.guildSupportChannelIDs.get(message.guildID)
    if (!supportChannelID || supportChannelID !== message.channel.id) return

    const botPerms = (message.channel as GuildTextableChannel).permissionsOf(Gamer.user.id)
    if (botPerms.has('manageMessages')) message.delete().catch(() => undefined)

    const mailCommand = Gamer.commandForName(`mail`)
    if (!mailCommand) return

    const prefix = Gamer.guildPrefixes.get(message.guildID) || Gamer.prefix

    const args = message.content.split(' ')
    args.shift()

    // Run the mail command for this user
    mailCommand.execute(message, args, { client: Gamer, commandName: `mail`, prefix })
  }
}
