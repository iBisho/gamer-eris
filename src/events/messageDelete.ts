import { TextChannel, Constants, Message, NewsChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'
import nodefetch from 'node-fetch'
import { EventListener } from 'yuuko'
import { sendMessage } from '../lib/utils/eris'

export default new EventListener('messageDelete', async (message, context) => {
  if (!(message.channel instanceof TextChannel) && !(message.channel instanceof NewsChannel)) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.channel.guild.id)

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.channel.guild.id })
  // If there is no channel set for logging this cancel
  if (!guildSettings?.moderation.logs.serverlogs.messages.channelID) return

  // Create the base embed that first can be sent to public logs
  const embed = new MessageEmbed()
    .setTitle(language(`moderation/logs:MESSAGE_DELETED`))
    .addField(language(`moderation/logs:MESSAGE_ID`), message.id, true)
    .addField(language(`moderation/logs:CHANNEL`), message.channel.mention, true)
    .setTimestamp()

  const logs = guildSettings.moderation.logs

  const botMember = await Gamer.helpers.discord.fetchMember(message.channel.guild, Gamer.user.id)
  if (!botMember?.permission.has('viewAuditLogs')) return

  const auditlogs = await message.channel.guild.getAuditLogs(
    undefined,
    undefined,
    Constants.AuditLogActions.MESSAGE_DELETE
  )

  if (logs.serverlogs.messages.editedPublicEnabled && logs.publiclogsChannelID)
    sendMessage(logs.publiclogsChannelID, { embed: embed.code })

  if (message instanceof Message && message.channel instanceof TextChannel) {
    embed.setThumbnail(message.author.avatarURL)
    if (message.attachments.length) {
      const buffer = await nodefetch(message.attachments[0].url)
        .then(res => res.buffer())
        .catch(() => undefined)
      if (buffer) embed.attachFile(buffer, 'deletedimage.png')
    }
    if (message.content) {
      embed.addField(language(`moderation/logs:MESSAGE_CONTENT`), message.content.substring(0, 1024))
      if (message.content.length > 1024)
        embed.addField(language(`moderation/logs:MESSAGE_CONTENT_CONTINUED`), message.content.substring(1024))
    }

    const auditLogEntry = auditlogs.entries.find(e => e.targetID === message.author.id)
    if (auditLogEntry) {
      embed
        .setAuthor(auditLogEntry.user.username, auditLogEntry.user.avatarURL)
        .addField(language(`moderation/logs:REASON`), auditLogEntry.reason || language(`common:NONE`))
        .setFooter(language(`moderation/logs:MESSAGE_WARNING`), message.channel.guild.iconURL)
    }
  }

  // Send the finalized embed to the log channel
  if (logs.serverlogs.messages.channelID) sendMessage(logs.serverlogs.messages.channelID, { embed: embed.code })
})
