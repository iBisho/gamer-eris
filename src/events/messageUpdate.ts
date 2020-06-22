import { PrivateChannel, Message, GroupChannel } from 'eris'
import Gamer from '..'
import { MessageEmbed } from 'helperis'
import { EventListener } from 'yuuko'
import { sendMessage } from '../lib/utils/eris'

export default new EventListener('messageUpdate', async (message, oldMessage, context) => {
  // Most embeds will always trigger a messageUpdate
  if (!message.editedTimestamp) return

  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return
  // Need message history perms to handle it properly below
  const botPerms = message.channel.permissionsOf(Gamer.user.id)
  if (!botPerms.has('readMessageHistory')) return

  // Valid message object so we can simply run the monitors
  if (!(message instanceof Message)) return

  if (!message.member) return

  // Check if the text is different to trigger commands and such
  if (message.content === oldMessage?.content) return

  // Just in case an actual edited message had urls in it
  if (oldMessage?.editedTimestamp !== message.editedTimestamp) return

  Gamer.emit('messageCreate', message, context)

  const language = Gamer.getLanguage(message.guildID)

  const urlToMessage = `https://discordapp.com/channels/${message.guildID}/${message.channel.id}/${message.id}`

  const embed = new MessageEmbed()
    .setAuthor(message.author.username, message.author.avatarURL)
    .setTitle(language(`moderation/logs:MESSAGE_EDITED`))
    .setThumbnail(message.author.avatarURL)
    .addField(language(`moderation/logs:USER`), message.author.mention, true)
    .addField(language(`moderation/logs:USER_ID`), message.author.id, true)
    .addField(language(`moderation/logs:MESSAGE_ID`), message.id, true)
    .addField(language(`moderation/logs:CHANNEL`), message.channel.mention, true)
    .addField(language(`moderation/logs:LINK_TO_MESSAGE`), urlToMessage)
    .setTimestamp()

  if (oldMessage && oldMessage.content.length) {
    embed.addField(language(`moderation/logs:OLD_CONTENT`), oldMessage.content.substring(0, 1024))
    if (oldMessage.content.length > 1024)
      embed.addField(language(`moderation/logs:MESSAGE_CONTENT_CONTINUED`), oldMessage.content.substring(1024))
  }

  if (message && message.content.length) {
    embed.addField(language(`moderation/logs:NEW_CONTENT`), message.content.substring(0, 1024))
    if (message.content.length > 1024)
      embed.addField(language(`moderation/logs:MESSAGE_CONTENT_CONTINUED`), message.content.substring(1024))
  }

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })

  if (guildSettings?.moderation.logs.serverlogs.messages.channelID)
    sendMessage(guildSettings.moderation.logs.serverlogs.messages.channelID, { embed: embed.code })
})
