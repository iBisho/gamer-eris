import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel, TextChannel } from 'eris'

export default new Command(`quote`, async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.channel.guild.id)

  const [messageID] = args
  if (!messageID) return helpCommand.process(message, [`quote`], context)

  const [channelID] = message.channelMentions

  const channel = channelID ? message.channel.guild.channels.get(channelID) : message.channel
  if (!channel || !(channel instanceof TextChannel)) return

  const botPerms = channel.permissionsOf(Gamer.user.id)
  if (!botPerms.has('readMessages') || !botPerms.has('readMessageHistory')) return

  const quotedMessage = channel.messages.get(messageID) || (await channel.getMessage(messageID).catch(() => undefined))
  if (!quotedMessage) return helpCommand.process(message, [`quote`], context)

  const quotedMessageEmbed = quotedMessage.embeds && quotedMessage.embeds.length && quotedMessage.embeds[0]

  const urlToMessage = `https://discordapp.com/channels/${message.channel.guild.id}/${channel.id}/${messageID}`

  const embed = new GamerEmbed()
    .setAuthor(`${quotedMessage.author.username}#${quotedMessage.author.discriminator}`, quotedMessage.author.avatarURL)
    .setTimestamp(quotedMessage.createdAt)
    .setDescription(
      [
        language('utility/quote:CLICK_HERE', { url: urlToMessage }),
        '',
        quotedMessageEmbed ? language(`utility/quote:EMBED`) : quotedMessage.content
      ].join('\n')
    )
    .setFooter(channel ? channel.name : ``)
  if (quotedMessage.attachments.length) embed.setImage(quotedMessage.attachments[0].url)

  return message.channel.createMessage({ embed: embed.code })
})
