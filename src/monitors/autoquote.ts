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

      const test = word.substring(word.indexOf('channels/') + 9).split('/')
      console.log(test)
      const [guildID, channelID, messageID] = word.substring(word.indexOf('channels/') + 9).split('/')
      // If link is from another server, do nothing
      if (!channelID || !messageID || !message.member || guildID !== message.member.guild.id) return

      // Clean up any unknown issues when 123123\n\nso
      const id = messageID.includes('\n') ? messageID.split('\n')[0]! : messageID

      quoteCommand.execute(message, [id, channelID], {
        prefix: Gamer.prefix,
        client: Gamer,
        commandName: 'quote'
      })
    })
  }
}
