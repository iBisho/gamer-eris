import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'
import { TextChannel } from 'eris'

export default new Command(`quote`, async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.guildID)

  const [messageID, channelID] = args
  if (!messageID) return helpCommand.execute(message, [`quote`], { ...context, commandName: 'help' })

  const channel =
    channelID || message.channelMentions.length
      ? message.member.guild.channels.get(channelID || message.channelMentions[0]!)
      : message.channel
  if (!channel || !(channel instanceof TextChannel)) return

  const botPerms = channel.permissionsOf(Gamer.user.id)
  if (!botPerms.has('readMessages') || !botPerms.has('readMessageHistory')) return

  const quotedMessage = channel.messages.get(messageID) || (await channel.getMessage(messageID).catch(() => undefined))
  if (!quotedMessage) return helpCommand.execute(message, [`quote`], { ...context, commandName: 'help' })

  const quotedMessageEmbed = quotedMessage.embeds && quotedMessage.embeds.length && quotedMessage.embeds[0]

  const urlToMessage = `https://discordapp.com/channels/${message.guildID}/${channel.id}/${messageID}`

  const embed = new MessageEmbed()
    .setAuthor(`${quotedMessage.author.username}#${quotedMessage.author.discriminator}`, quotedMessage.author.avatarURL)
    .setTimestamp(quotedMessage.createdAt)
    .setDescription(
      [
        language('utility/quote:CLICK_HERE', { url: urlToMessage }),
        '',
        quotedMessage.content + quotedMessageEmbed ? '\n*' + language(`utility/quote:EMBED`) + '*' : ''
      ].join('\n')
    )
    .setFooter(channel ? `#${channel.name}` : ``)
  const [attachment] = quotedMessage.attachments
  if (attachment) embed.setImage(attachment.url)

  return message.channel.createMessage({ embed: embed.code })
})
