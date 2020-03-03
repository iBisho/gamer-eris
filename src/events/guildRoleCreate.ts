import Event from '../lib/structures/Event'
import { Guild, Role, TextChannel, Constants } from 'eris'
import Gamer from '..'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default class extends Event {
  async execute(guild: Guild, role: Role) {
    const language = Gamer.getLanguage(guild.id)

    // Create the base embed that first can be sent to public logs
    const embed = new GamerEmbed()
      .setTitle(language(`moderation/logs:ROLE_CREATED`))
      .addField(language(`moderation/logs:ROLE_NAME`), `<@&${role.id}>`, true)
      .addField(language(`moderation/logs:ROLE_ID`), role.id, true)
      .addField(language(`moderation/logs:TOTAL_ROLES`), role.guild.roles.size.toString(), true)
      .addField(language(`moderation/logs:MENTIONABLE`), Gamer.helpers.discord.booleanEmoji(role.mentionable), true)
      .addField(language(`moderation/logs:HOISTED`), Gamer.helpers.discord.booleanEmoji(role.hoist), true)
      .addField(language(`moderation/logs:POSITION`), role.position.toString(), true)
      .setFooter(role.name, `https://i.imgur.com/Ya0SXdI.png`)
      .setThumbnail(`https://i.imgur.com/Ya0SXdI.png`)
      .setTimestamp()

    const guildSettings = await Gamer.database.models.guild.findOne({ id: guild.id })
    if (!guildSettings?.moderation.logs.serverlogs.roles.channelID) return

    const logs = guildSettings.moderation.logs
    if (logs.publiclogsChannelID && logs.serverlogs.roles.createPublicEnabled) {
      const publicChannel = logs.publiclogsChannelID ? guild.channels.get(logs.publiclogsChannelID) : undefined

      if (publicChannel && publicChannel instanceof TextChannel) {
        const botPerms = publicChannel.permissionsOf(Gamer.user.id)
        if (botPerms.has(`embedLinks`) && botPerms.has(`readMessages`) && botPerms.has(`sendMessages`))
          publicChannel.createMessage({ embed: { ...embed.code, color: role.color } })
      }
    }

    const botMember = await Gamer.helpers.discord.fetchMember(guild, Gamer.user.id)
    if (!botMember?.permission.has('viewAuditLogs')) return

    // Fetch the auditlogs and add the author to the embed of the one who made the role and the reason it was made.
    const auditlogs = await guild.getAuditLogs(undefined, undefined, Constants.AuditLogActions.ROLE_CREATE)
    if (auditlogs) {
      const auditLogEntry = auditlogs.entries.find(e => e.targetID === role.id)
      if (auditLogEntry) {
        embed
          .setAuthor(auditLogEntry.user.username, auditLogEntry.user.avatarURL)
          .addField(language(`moderation/logs:REASON`), auditLogEntry.reason || language(`common:NONE`))
      }
    }

    const logChannel = guild.channels.get(guildSettings.moderation.logs.serverlogs.roles.channelID)
    // Send the finalized embed to the log channel
    if (logChannel instanceof TextChannel) {
      const botPerms = logChannel.permissionsOf(Gamer.user.id)
      if (botPerms.has(`embedLinks`) && botPerms.has(`readMessages`) && botPerms.has(`sendMessages`))
        logChannel.createMessage({ embed: { ...embed.code, color: role.color } })
    }
  }
}
