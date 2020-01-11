import Event from '../lib/structures/Event'
import { PrivateChannel, TextChannel, VoiceChannel, CategoryChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { TFunction } from 'i18next'
import { GuildSettings } from '../lib/types/settings'

export default class extends Event {
  async execute(channel: PrivateChannel | TextChannel | VoiceChannel | CategoryChannel) {
    if (channel instanceof PrivateChannel) return

    const Gamer = channel.guild.shard.client as GamerClient
    const language = Gamer.i18n.get(Gamer.guildLanguages.get(channel.guild.id) || `en-US`)
    if (!language) return

    const guildSettings = await Gamer.database.models.guild.findOne({ id: channel.guild.id })
    if (!guildSettings) return

    this.handleRolePerms(channel, Gamer.user.id, guildSettings, language)

    this.handleServerlog(
      channel,
      guildSettings.moderation.logs.serverlogs.channels.channelID,
      guildSettings.moderation.logs.serverlogs.channels.createPublicEnabled,
      guildSettings.moderation.logs.publiclogsChannelID,
      language,
      Gamer
    )
  }

  async handleRolePerms(
    channel: TextChannel | VoiceChannel | CategoryChannel,
    gamerID: string,
    settings: GuildSettings,
    language: TFunction
  ) {
    const botPerms = channel.permissionsOf(gamerID)
    // Don't have permissions to edit this channels perms
    if (!botPerms.has('manageRoles') || !botPerms.has('manageChannels')) return

    // Deny view perms for Verify role
    if (
      settings.verify.categoryID &&
      settings.verify.roleID &&
      channel.parentID !== settings.verify.categoryID &&
      channel.guild.roles.has(settings.verify.roleID)
    ) {
      channel.editPermission(settings.verify.roleID, 0, 1024, `role`, language(`basic/verify:PERMISSION`))
    }

    // If the mute role exists disable all SEND/SPEAK permissions
    if (
      settings.moderation.roleIDs.mute &&
      channel.guild.roles.has(settings.moderation.roleIDs.mute) &&
      channel.guild.roles.has(settings.moderation.roleIDs.mute)
    )
      channel.editPermission(
        settings.moderation.roleIDs.mute,
        0,
        2099264,
        `role`,
        language(`moderation/mute:PERMISSION`)
      )
  }

  async handleServerlog(
    channel: TextChannel | VoiceChannel | CategoryChannel,
    channelID: string | undefined,
    createPublicEnabled: boolean,
    publiclogsChannelID: string | undefined,
    language: TFunction,
    Gamer: GamerClient
  ) {
    // First make sure that we even need to send the logs here
    if (!channelID) return

    const NONE = language(`common:NONE`)
    // Create the base embed that first can be sent to public logs
    const embed = new GamerEmbed()
      .setTitle(language(`moderation/logs:CHANNEL_CREATED`))
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

    // If public logs are enabled properly then send the embed there
    if (createPublicEnabled && publiclogsChannelID) {
      const publicLogChannel = channel.guild.channels.get(publiclogsChannelID)
      if (publicLogChannel instanceof TextChannel) {
        const botPerms = publicLogChannel.permissionsOf(Gamer.user.id)
        if (publicLogChannel && botPerms.has('embedLinks')) publicLogChannel.createMessage({ embed: embed.code })
      }
    }

    // Fetch the auditlogs and add the author to the embed of the one who made the role and the reason it was made.
    const auditlogs = await channel.guild.getAuditLogs(undefined, undefined, 10)
    if (auditlogs) {
      const auditLogEntry = auditlogs.entries.find(e => e.targetID === channel.id)
      if (auditLogEntry) {
        embed
          .setAuthor(auditLogEntry.user.username, auditLogEntry.user.avatarURL)
          .addField(language(`moderation/logs:REASON`), auditLogEntry.reason || NONE)
      }
    }

    // Send the finalized embed to the log channel
    const logChannel = channel.guild.channels.get(channelID)
    if (logChannel instanceof TextChannel) {
      const botPerms = logChannel.permissionsOf(Gamer.user.id)
      if (botPerms.has(`embedLinks`)) logChannel.createMessage({ embed: embed.code })
    }
  }
}
