import Event from '../lib/structures/Event'
import { TextChannel, Guild, Constants, User } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { modlogTypes } from '../lib/types/enums/moderation'

export default class extends Event {
  async execute(guild: Guild, user: User) {
    const Gamer = guild.shard.client as GamerClient
    const language = Gamer.getLanguage(guild.id)

    const guildSettings = await Gamer.database.models.guild.findOne({ id: guild.id })
    // If there is no channel set for logging this cancel
    if (!guildSettings?.moderation.logs.serverlogs.members.channelID) return

    // Create the base embed that first can be sent to public logs
    const userTag = `${user.username}#${user.discriminator}`
    const embed = new GamerEmbed()
      .setTitle(language(`moderation/logs:USER_UNBANNED`))
      .addField(language(`moderation/logs:USER`), userTag, true)
      .addField(language(`moderation/logs:USER_ID`), user.id, true)
      .addField(language(`moderation/logs:TOTAL_USERS`), guild.memberCount.toString(), true)
      .setFooter(userTag, modlogTypes.BAN_IMAGE)
      .setThumbnail(user.avatarURL)
      .setTimestamp()

    const botMember = await Gamer.helpers.discord.fetchMember(guild, Gamer.user.id)
    if (!botMember?.permission.has('viewAuditLogs')) return

    // Fetch the auditlogs and add the author to the embed of the one who made the role and the reason it was made.
    const auditlogs = await guild.getAuditLogs(undefined, undefined, Constants.AuditLogActions.MEMBER_BAN_REMOVE)
    const auditLogEntry = auditlogs.entries.find(e => e.targetID === user.id)
    if (auditLogEntry) {
      embed
        .setAuthor(auditLogEntry.user.username, auditLogEntry.user.avatarURL)
        .addField(language(`moderation/logs:REASON`), auditLogEntry.reason || language(`common:NONE`))
    }

    // Send the finalized embed to the log channel
    const logChannel = guild.channels.get(guildSettings.moderation.logs.serverlogs.members.channelID)
    if (logChannel instanceof TextChannel) {
      const botPerms = logChannel.permissionsOf(Gamer.user.id)
      if (botPerms.has(`embedLinks`) && botPerms.has(`readMessages`) && botPerms.has(`sendMessages`))
        logChannel.createMessage({ embed: embed.code })
    }
  }
}
