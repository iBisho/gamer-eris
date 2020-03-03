import Event from '../lib/structures/Event'
import { TextChannel, Constants, Message, PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { PartialMessage } from '../lib/types/discord'
import nodefetch from 'node-fetch'

export default class extends Event {
  async execute(message: Message | PartialMessage) {
    if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

    const Gamer = message.channel.guild.shard.client as GamerClient
    const language = Gamer.getLanguage(message.channel.guild.id)

    const guildSettings = await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })
    // If there is no channel set for logging this cancel
    if (!guildSettings?.moderation.logs.serverlogs.messages.channelID) return

    // Create the base embed that first can be sent to public logs
    const embed = new GamerEmbed()
      .setTitle(language(`moderation/logs:MESSAGE_DELETED`))
      .addField(language(`moderation/logs:MESSAGE_ID`), message.id, true)
      .addField(language(`moderation/logs:CHANNEL`), message.channel.mention, true)
      .setTimestamp()

    const logs = guildSettings.moderation.logs

    const publicChannel = logs.publiclogsChannelID
      ? message.channel.guild.channels.get(logs.publiclogsChannelID)
      : undefined

    const botMember = await Gamer.helpers.discord.fetchMember(message.channel.guild, Gamer.user.id)
    if (!botMember?.permission.has('viewAuditLogs')) return

    const auditlogs = await message.channel.guild.getAuditLogs(
      undefined,
      undefined,
      Constants.AuditLogActions.MESSAGE_DELETE
    )

    const logChannel = logs.serverlogs.messages.channelID
      ? message.channel.guild.channels.get(logs.serverlogs.messages.channelID)
      : undefined

    if (logs.serverlogs.messages.deletedPublicEnabled && publicChannel && publicChannel instanceof TextChannel)
      publicChannel.createMessage({ embed: embed.code })

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
    if (logChannel && logChannel instanceof TextChannel) {
      const botPerms = logChannel.permissionsOf(Gamer.user.id)
      if (botPerms.has(`embedLinks`) && botPerms.has(`readMessages`) && botPerms.has(`sendMessages`))
        logChannel.createMessage({ embed: embed.code })
    }
  }
}
