import { Constants } from 'eris'
import Gamer from '..'
import { MessageEmbed } from 'helperis'
import { EventListener } from 'yuuko'
import { sendMessage } from '../lib/utils/eris'

export default new EventListener('guildRoleDelete', async (guild, role) => {
  const language = Gamer.getLanguage(guild.id)

  // Create the base embed that first can be sent to public logs
  const embed = new MessageEmbed()
    .setTitle(language(`moderation/logs:ROLE_DELETED`))
    .addField(language(`moderation/logs:ROLE_NAME`), role.name, true)
    .addField(language(`moderation/logs:ROLE_ID`), role.id, true)
    .addField(language(`moderation/logs:TOTAL_ROLES`), role.guild.roles.size.toString(), true)
    .setFooter(role.name, `https://i.imgur.com/iZPBVKB.png`)
    .setThumbnail(`https://i.imgur.com/iZPBVKB.png`)
    .setTimestamp()

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: guild.id })
  if (!guildSettings?.moderation.logs.serverlogs.roles.channelID) return

  const logs = guildSettings.moderation.logs
  if (logs.publiclogsChannelID && logs.serverlogs.roles.deletePublicEnabled)
    sendMessage(logs.publiclogsChannelID, { embed: { ...embed.code, color: role.color } })

  const botMember = await Gamer.helpers.discord.fetchMember(guild, Gamer.user.id)
  if (!botMember?.permission.has('viewAuditLogs')) return

  // Fetch the auditlogs and add the author to the embed of the one who made the role and the reason it was made.
  const auditlogs = await guild.getAuditLogs(undefined, undefined, Constants.AuditLogActions.ROLE_DELETE)
  if (auditlogs) {
    const auditLogEntry = auditlogs.entries.find(e => e.targetID === role.id)
    if (auditLogEntry) {
      embed
        .setAuthor(auditLogEntry.user.username, auditLogEntry.user.avatarURL)
        .addField(language(`moderation/logs:REASON`), auditLogEntry.reason || language(`common:NONE`))
    }
  }

  // Send the finalized embed to the log channel
  sendMessage(guildSettings.moderation.logs.serverlogs.roles.channelID, { embed: embed.code })
})
