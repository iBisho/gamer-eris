import Monitor from '../lib/structures/Monitor'
import { Message } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    if (!message.content.length) return

    const quoteCommand = Gamer.commandForName('quote')
    if (!quoteCommand) return

    message.content.split(' ').forEach(word => {
      if (!word.startsWith('https://discordapp.com/channels/') && !word.startsWith('https://discord.com/channels/'))
        return

      const [guildID, channelID, messageID] = word.substring(word.indexOf('channels/') + 9).split('/')

      // If link is from another server, do nothing
      if (!channelID || !message.member || guildID !== message.member.guild.id) return

      // If different channel do nothing cause it might be a private guild only channel
      // if (message.channel.id !== channelID) return

      quoteCommand.execute(message, [messageID, channelID], {
        prefix: Gamer.prefix,
        client: Gamer,
        commandName: 'quote'
      })
    })
  }
}
