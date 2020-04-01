import Event from '../lib/structures/Event'
import { TextChannel, Member, Guild } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { MessageEmbed, highestRole } from 'helperis'

export default class extends Event {
  async execute(guild: Guild, member: Member) {
    const Gamer = guild.shard.client as GamerClient
    Gamer.amplitude.push({
      authorID: member.id,
      guildID: guild.id,
      timestamp: Date.now(),
      type: 'MEMBER_ADDED'
    })

    const botMember = await Gamer.helpers.discord.fetchMember(guild, Gamer.user.id)
    if (!botMember) return

    const language = Gamer.getLanguage(guild.id)

    const botsHighestRole = highestRole(botMember)
    const membersHighestRole = highestRole(member)

    const guildSettings = await Gamer.database.models.guild.findOne({ id: guild.id })
    // If no custom guild settings cancel out
    if (!guildSettings) return

    // Mute Role

    // In case other bots/users add a role to the user we do this check
    if (botMember.permission.has('manageRoles') && botsHighestRole.position > membersHighestRole.position) {
      if (guildSettings.moderation.roleIDs.mute && guildSettings.moderation.users.mutedUserIDs.includes(member.id)) {
        const muteRole = guild.roles.get(guildSettings.moderation.roleIDs.mute)
        if (muteRole && muteRole.position < botsHighestRole.position)
          member.addRole(muteRole.id, language(`moderation/mute:GUILDMEMBERADD_MUTED`))
      }
      // Verify Or AutoRole

      // If verification is enabled and the role id is set add the verify role
      if (guildSettings.verify.enabled && guildSettings.verify.roleID) {
        const verifyRole = guild.roles.get(guildSettings.verify.roleID)
        if (verifyRole && verifyRole.position < botsHighestRole.position)
          member.addRole(guildSettings.verify.roleID, language(`basic/verify:VERIFY_ACTIVATE`))
      }
      // If discord verification is disabled and auto role is set give the member the auto role
      else if (
        !guildSettings.verify.discordVerificationStrictnessEnabled &&
        guildSettings.moderation.roleIDs.autorole &&
        guild.roles.has(guildSettings.moderation.roleIDs.autorole)
      ) {
        const autoRole = guild.roles.get(guildSettings.moderation.roleIDs.autorole)
        if (autoRole && autoRole.position < botsHighestRole.position)
          member.addRole(guildSettings.moderation.roleIDs.autorole, language(`basic/verify:AUTOROLE_ASSIGNED`))
      }
    }

    // Welcome Message
    if (guildSettings.hibye.welcome.message) {
      try {
        const emojis = await Gamer.database.models.emoji.find()
        const isEmbed = guildSettings.hibye.welcome.message.startsWith('{')
        const transformed = Gamer.helpers.transform.variables(
          guildSettings.hibye.welcome.message,
          member.user,
          member.guild,
          member.user,
          emojis
        )

        const embed = isEmbed ? JSON.parse(transformed) : undefined

        if (embed) {
          if (typeof embed.image === 'string') embed.image = { url: embed.image }
          if (typeof embed.thumbnail === 'string') embed.thumbnail = { url: embed.thumbnail }
          if (embed.color === 'RANDOM') embed.color = Math.floor(Math.random() * (0xffffff + 1))
          if (embed.timestamp) embed.timestamp = new Date().toISOString()
        }

        if (guildSettings.hibye.welcome.dmEnabled) {
          const dmChannel = await member.user.getDMChannel()
          if (embed) await dmChannel.createMessage({ embed })
          else await dmChannel.createMessage(transformed)
        }
        if (guildSettings.hibye.welcome.channelID) {
          const welcomeChannel = guild.channels.get(guildSettings.hibye.welcome.channelID)
          if (welcomeChannel && welcomeChannel instanceof TextChannel) {
            if (embed) welcomeChannel.createMessage({ embed })
            else welcomeChannel.createMessage(transformed)
          }
        }
      } catch {}
    }

    // Server logs feature
    // If there is no channel set for logging this cancel
    if (!guildSettings.moderation.logs.serverlogs.members.channelID) return

    // Create the base embed that first can be sent to public logs
    const embed = new MessageEmbed()
      .setTitle(language(`moderation/logs:MEMBER_JOINED`))
      .addField(language(`moderation/logs:MEMBER_NAME`), member.mention, true)
      .addField(language(`moderation/logs:USER_ID`), member.id, true)
      .addField(language(`moderation/logs:TOTAL_MEMBERS`), member.guild.memberCount.toString(), true)
      .setFooter(`${member.username}#${member.discriminator}`, `https://i.imgur.com/Ya0SXdI.png`)
      .setThumbnail(member.avatarURL)
      .setTimestamp()

    const logs = guildSettings.moderation.logs

    // If public logs are enabled properly then send the embed there
    if (logs.serverlogs.members.addPublicEnabled && logs.publiclogsChannelID) {
      const publicLogChannel = guild.channels.get(logs.publiclogsChannelID)
      if (publicLogChannel instanceof TextChannel) {
        const hasPermission = Gamer.helpers.discord.checkPermissions(publicLogChannel, Gamer.user.id, [
          `embedLinks`,
          `readMessages`,
          `sendMessages`
        ])
        if (hasPermission) publicLogChannel.createMessage({ embed: embed.code })
      }
    }

    // Send the finalized embed to the log channel
    const logChannel = guild.channels.get(guildSettings.moderation.logs.serverlogs.members.channelID)
    if (logChannel instanceof TextChannel) {
      const hasPermission = Gamer.helpers.discord.checkPermissions(logChannel, Gamer.user.id, [
        `embedLinks`,
        `readMessages`,
        `sendMessages`
      ])
      if (hasPermission) logChannel.createMessage({ embed: embed.code })
    }
  }
}
