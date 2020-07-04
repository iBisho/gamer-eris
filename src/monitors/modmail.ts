import Monitor from '../lib/structures/Monitor'
import { Message, GuildTextableChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { deleteMessage } from '../lib/utils/eris'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    // If the message was not a mention of the bot cancel
    if (!message.guildID) return

    const supportChannelID = Gamer.guildSupportChannelIDs.get(message.guildID)
    if (!supportChannelID || supportChannelID !== message.channel.id) return

    const botPerms = (message.channel as GuildTextableChannel).permissionsOf(Gamer.user.id)
    if (botPerms.has('manageMessages')) deleteMessage(message, 10)
    if (message.author.bot && message.author.id !== Gamer.user.id) deleteMessage(message)

    const mailCommand = Gamer.commandForName(`mail`)
    if (!mailCommand) return

    const prefix = Gamer.guildPrefixes.get(message.guildID) || Gamer.prefix

    if (mailCommand.names.some(name => message.content.startsWith(`${prefix}${name} `))) return

    Gamer.helpers.logger.blue(`ModMail Support: Ran in ${message.member?.guild.name}`)
    // Run the mail command for this user
    mailCommand.execute(message, [message.content], { client: Gamer, commandName: `mail`, prefix })
  }
}
