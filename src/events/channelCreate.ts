import Event from '../lib/structures/Event'
import { PrivateChannel, TextChannel, VoiceChannel, CategoryChannel, AnyGuildChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'
import * as i18next from 'i18next'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GuildDefaults from '../constants/settings/guild'

export default class extends Event {
  async execute(channel: PrivateChannel | TextChannel | VoiceChannel | CategoryChannel) {
    if (channel instanceof PrivateChannel) return

    const Gamer = channel.guild.shard.client as GamerClient
    const guildSettings =
      ((await Gamer.database.models.guild.findOne({ id: channel.guild.id })) as GuildSettings | null) || GuildDefaults

    const language = Gamer.i18n.get(guildSettings ? guildSettings.language : 'en-US')
    if (!language) return

    // Verification categories are automatically handled
    if (
      !guildSettings.verify.categoryID ||
      (channel.parentID !== guildSettings.verify.categoryID && guildSettings.verify.channelIDs.includes(channel.id))
    ) {
      // If the verification role exists disable all READ permissions
      if (guildSettings.verify.roleID)
        channel.editPermission(guildSettings.verify.roleID, 0, 1024, `role`, language(`basic/verify:PERMISSION`))
      // If the mute role exists disable all SEND/SPEAK permissions
      if (guildSettings.moderation.roleIDs.mute)
        channel.editPermission(
          guildSettings.moderation.roleIDs.mute,
          1024,
          2099264,
          `role`,
          language(`moderation/mute:PERMISSION`)
        )
    }

    this.handleServerlog(
      channel,
      guildSettings.moderation.logs.serverlogs.channels.channelID,
      guildSettings.moderation.logs.serverlogs.channels.createPublicEnabled,
      guildSettings.moderation.logs.publiclogsChannelID,
      language,
      Gamer
    )
  }

  async handleServerlog(
    channel: TextChannel | VoiceChannel | CategoryChannel,
    channelID: string | undefined,
    createPublicEnabled: boolean,
    publiclogsChannelID: string | undefined,
    language: i18next.TFunction,
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
      const auditLogEntry = auditlogs.entries.find(e => (e.target as AnyGuildChannel).id === channel.id)
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
