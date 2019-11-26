import Event from '../lib/structures/Event'
import { PrivateChannel, TextChannel, VoiceChannel, CategoryChannel, AnyGuildChannel, Constants } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default class extends Event {
  async execute(channel: PrivateChannel | TextChannel | VoiceChannel | CategoryChannel) {
    if (channel instanceof PrivateChannel) return

    const Gamer = channel.guild.shard.client as GamerClient

    if (channel instanceof TextChannel) {
      // Check if this channel was a mail channel
      const mailChannel = await Gamer.database.models.mail.findOne({ id: channel.id })
      // If it was a mail channel delete it
      if (mailChannel) await Gamer.database.models.mail.deleteOne({ _id: mailChannel._id })

      // Check if this channel was a channel with an event card
      const events = await Gamer.database.models.event.find({ adChannelID: channel.id })
      if (events.length) {
        await Promise.all(
          events.map(event => {
            event.adChannelID = undefined
            event.adMessageID = undefined
            return event.save()
          })
        )
      }
    }

    // Server logs feature
    const language = Gamer.i18n.get(Gamer.guildLanguages.get(channel.guild.id) || `en-US`)
    if (!language) return

    const guildSettings = await Gamer.database.models.guild.findOne({ id: channel.guild.id })

    // If there is no channel set for logging this cancel
    if (!guildSettings?.moderation.logs.serverlogs.channels.channelID) return

    const NONE = language(`common:NONE`)
    // Create the base embed that first can be sent to public logs
    const embed = new GamerEmbed()
      .setTitle(language(`moderation/logs:CHANNEL_DELETED`))
      .addField(language(`moderation/logs:CHANNEL`), channel.mention, true)
      .addField(language(`moderation/logs:CHANNEL_ID`), channel.id, true)
      .addField(language(`moderation/logs:TOTAL_CHANNELS`), channel.guild.channels.size.toString(), true)
      .addField(language(`moderation/logs:CHANNEL_TYPE`), channel.type.toString(), true)
      .addField(
        language(`moderation/logs:CHANNEL_CATEGORY`),
        channel.parentID ? (channel.guild.channels.get(channel.parentID) as CategoryChannel).name : NONE,
        true
      )
      .addField(language(`moderation/logs:POSITION`), channel.position.toString(), true)
      .setFooter(channel.name, channel.guild.iconURL)
      .setThumbnail(`https://i.imgur.com/Ya0SXdI.png`)
      .setTimestamp()

    const logs = guildSettings.moderation.logs

    // If public logs are enabled properly then send the embed there
    if (logs.serverlogs.channels.createPublicEnabled && logs.publiclogsChannelID) {
      const publicLogChannel = channel.guild.channels.get(logs.publiclogsChannelID)
      if (publicLogChannel instanceof TextChannel) {
        const botPerms = publicLogChannel.permissionsOf(Gamer.user.id)
        if (publicLogChannel && botPerms.has('embedLinks')) publicLogChannel.createMessage({ embed: embed.code })
      }
    }

    // Fetch the auditlogs and add the author to the embed of the one who made the role and the reason it was made.
    const auditlogs = await channel.guild.getAuditLogs(undefined, undefined, Constants.AuditLogActions.CHANNEL_DELETE)
    const auditLogEntry = auditlogs.entries.find(e => (e.target as AnyGuildChannel).id === channel.id)
    if (auditLogEntry) {
      embed
        .setAuthor(auditLogEntry.user.username, auditLogEntry.user.avatarURL)
        .addField(language(`moderation/logs:REASON`), auditLogEntry.reason || NONE)
    }

    // Send the finalized embed to the log channel
    const logChannel = channel.guild.channels.get(guildSettings.moderation.logs.serverlogs.channels.channelID)
    if (logChannel instanceof TextChannel) {
      const botPerms = logChannel.permissionsOf(Gamer.user.id)
      if (botPerms.has(`embedLinks`) && botPerms.has(`readMessages`) && botPerms.has(`sendMessages`))
        logChannel.createMessage({ embed: embed.code })
    }
  }
}
