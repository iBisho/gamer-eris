import { PrivateChannel, TextChannel, VoiceChannel, CategoryChannel, AnyGuildChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { MessageEmbed, highestRole } from 'helperis'
import { TFunction } from 'i18next'
import { GuildSettings } from '../lib/types/settings'
import { EventListener } from 'yuuko'

function handleRolePerms(channel: AnyGuildChannel, gamerID: string, settings: GuildSettings, language: TFunction) {
  const Gamer = channel.guild.shard.client as GamerClient
  const botMember = channel.guild.members.get(gamerID)
  const hasPermission =
    channel instanceof VoiceChannel
      ? Gamer.helpers.discord.checkPermissions(channel, gamerID, [
          `manageRoles`,
          `manageChannels`,
          `voiceConnect`,
          `readMessages`
        ])
      : Gamer.helpers.discord.checkPermissions(channel, gamerID, [`manageRoles`, `manageChannels`, `readMessages`])
  // Don't have permissions to edit this channels perms
  if (!hasPermission || !botMember?.permission?.has('manageRoles')) return

  const botHighestRole = highestRole(botMember)

  // Deny view perms for Verify role
  if (settings.verify.categoryID && settings.verify.roleID && channel.parentID !== settings.verify.categoryID) {
    const role = channel.guild.roles.get(settings.verify.roleID)
    if (!role || role.position >= botHighestRole.position) return

    channel.editPermission(settings.verify.roleID, 0, 1024, `role`, language(`basic/verify:PERMISSION`))
  }

  // If the mute role exists disable all SEND/SPEAK permissions
  if (settings.moderation.roleIDs.mute) {
    const role = channel.guild.roles.get(settings.moderation.roleIDs.mute)
    if (!role || role.position > botHighestRole.position) return

    const hasMutePermission = Gamer.helpers.discord.checkPermissions(channel, gamerID, [
      `sendMessages`,
      `addReactions`,
      `voiceSpeak`
    ])
    if (!hasMutePermission) return

    channel.editPermission(
      settings.moderation.roleIDs.mute,
      0,
      // Send Messages, Add Reactions, Speak
      2099264,
      `role`,
      language(`moderation/mute:PERMISSION`)
    )
  }
}

async function handleServerlog(
  channel: AnyGuildChannel,
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
  const embed = new MessageEmbed()
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

  const botMember = await Gamer.helpers.discord.fetchMember(channel.guild, Gamer.user.id)
  if (!botMember?.permission.has('viewAuditLogs')) return

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

export default new EventListener('channelCreate', async (channel, context) => {
  if (channel instanceof PrivateChannel) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(channel.guild.id)

  const guildSettings = await Gamer.database.models.guild.findOne({ id: channel.guild.id })
  if (!guildSettings) return

  handleRolePerms(channel, Gamer.user.id, guildSettings, language)

  handleServerlog(
    channel,
    guildSettings.moderation.logs.serverlogs.channels.channelID,
    guildSettings.moderation.logs.serverlogs.channels.createPublicEnabled,
    guildSettings.moderation.logs.publiclogsChannelID,
    language,
    Gamer
  )
})
