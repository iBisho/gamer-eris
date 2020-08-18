import { PrivateChannel, TextChannel, CategoryChannel, Constants } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'
import { EventListener } from 'yuuko'

export default new EventListener('channelDelete', async (channel, context) => {
  if (channel instanceof PrivateChannel) return

  const Gamer = context.client as GamerClient

  if (channel instanceof TextChannel) {
    // Check if this channel was a mail channel
    const mailChannel = await Gamer.database.models.mail.findOne({ channelID: channel.id })
    // If it was a mail channel delete it
    if (mailChannel) Gamer.database.models.mail.deleteOne({ _id: mailChannel._id }).exec()

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
  const language = Gamer.getLanguage(channel.guild.id)

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: channel.guild.id })

  // If there is no channel set for logging this cancel
  if (!guildSettings?.moderation.logs.serverlogs.channels.channelID) return

  const NONE = language(`common:NONE`)
  // Create the base embed that first can be sent to public logs
  const embed = new MessageEmbed()
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
    .setFooter(channel.name, channel.guild.iconURL || undefined)
    .setThumbnail(`https://i.imgur.com/Ya0SXdI.png`)
    .setTimestamp()

  const logs = guildSettings.moderation.logs

  // If public logs are enabled properly then send the embed there
  if (logs.serverlogs.channels.createPublicEnabled && logs.publiclogsChannelID) {
    const publicLogChannel = channel.guild.channels.get(logs.publiclogsChannelID)
    if (publicLogChannel && publicLogChannel instanceof TextChannel) {
      const botPerms = publicLogChannel.permissionsOf(Gamer.user.id)
      if (botPerms.has(`embedLinks`) && botPerms.has(`readMessages`) && botPerms.has(`sendMessages`))
        publicLogChannel.createMessage({ embed: embed.code })
    }
  }

  const botMember = await Gamer.helpers.discord.fetchMember(channel.guild, Gamer.user.id)
  if (!botMember?.permission.has('viewAuditLogs')) return

  // Fetch the auditlogs and add the author to the embed of the one who made the role and the reason it was made.
  const auditlogs = await channel.guild.getAuditLogs(undefined, undefined, Constants.AuditLogActions.CHANNEL_DELETE)
  const auditLogEntry = auditlogs.entries.find(e => e.targetID === channel.id)
  if (auditLogEntry) {
    embed
      .setAuthor(auditLogEntry.user.username, auditLogEntry.user.avatarURL)
      .addField(language(`moderation/logs:REASON`), auditLogEntry.reason || NONE)
  }

  // Send the finalized embed to the log channel
  const logChannel = channel.guild.channels.get(guildSettings.moderation.logs.serverlogs.channels.channelID)
  if (logChannel && logChannel instanceof TextChannel) {
    const botPerms = logChannel.permissionsOf(Gamer.user.id)
    if (botPerms.has(`embedLinks`) && botPerms.has(`readMessages`) && botPerms.has(`sendMessages`))
      logChannel.createMessage({ embed: embed.code })
  }
})
