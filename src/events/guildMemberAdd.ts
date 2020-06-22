import { TextChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { MessageEmbed, highestRole } from 'helperis'
import { EventListener } from 'yuuko'
import { addRoleToMember, sendMessage } from '../lib/utils/eris'

export default new EventListener('guildMemberAdd', async (guild, member) => {
  const Gamer = guild.shard.client as GamerClient
  Gamer.amplitude.push({
    authorID: member.id,
    guildID: guild.id,
    timestamp: Date.now(),
    type: 'MEMBER_ADDED'
  })

  Gamer.database.models.analytics.create({
    guildID: guild.id,
    userID: member.id,
    messageID: 'N/A',
    channelID: 'N/A',
    timestamp: Date.now(),
    type: 'MEMBER_ADDED'
  })

  const userSettings = await Gamer.database.models.user.findOne({ userID: member.id })
  if (userSettings) {
    if (!userSettings.guildIDs.includes(guild.id)) {
      userSettings.guildIDs.push(guild.id)
      userSettings.save()
    }
  }

  const botMember = await Gamer.helpers.discord.fetchMember(guild, Gamer.user.id)
  if (!botMember) return

  const memberRoles = await Gamer.database.models.roles.findOne({ memberID: member.id, guildID: guild.id })
  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: guild.id })
  const language = Gamer.getLanguage(guild.id)

  if (guildSettings?.moderation.reassignRolesOnJoin) {
    memberRoles?.roleIDs.forEach(id => {
      addRoleToMember(member, id, language('roles/role:REASSIGN_ON_JOIN'))
    })
  }

  if (!memberRoles && member.roles.length) {
    Gamer.database.models.roles.create({ memberID: member.id, guildID: guild.id, roleIDs: member.roles })
  }

  if (!guildSettings) return

  const botsHighestRole = highestRole(botMember)
  const membersHighestRole = highestRole(member)

  // Mute Role

  // In case other bots/users add a role to the user we do this check
  if (botMember.permission.has('manageRoles') && botsHighestRole.position > membersHighestRole.position) {
    if (guildSettings.moderation.roleIDs.mute && guildSettings.moderation.users.mutedUserIDs.includes(member.id)) {
      const muteRole = guild.roles.get(guildSettings.moderation.roleIDs.mute)
      if (muteRole && muteRole.position < botsHighestRole.position)
        addRoleToMember(member, muteRole.id, language(`moderation/mute:GUILDMEMBERADD_MUTED`))
    }
    // Verify Or AutoRole

    // If verification is enabled and the role id is set add the verify role
    if (guildSettings.verify.enabled && guildSettings.verify.roleID) {
      const verifyRole = guild.roles.get(guildSettings.verify.roleID)
      if (verifyRole && verifyRole.position < botsHighestRole.position)
        addRoleToMember(member, guildSettings.verify.roleID, language(`basic/verify:VERIFY_ACTIVATE`))
    }
    // If discord verification is disabled and auto role is set give the member the auto role
    else if (
      !guildSettings.verify.discordVerificationStrictnessEnabled &&
      guildSettings.moderation.roleIDs.autorole &&
      guild.roles.has(guildSettings.moderation.roleIDs.autorole)
    ) {
      const autoRole = guild.roles.get(guildSettings.moderation.roleIDs.autorole)
      if (autoRole && autoRole.position < botsHighestRole.position)
        addRoleToMember(member, guildSettings.moderation.roleIDs.autorole, language(`basic/verify:AUTOROLE_ASSIGNED`))
    }
  }

  // Welcome Message
  if (guildSettings.hibye.welcome.message) {
    try {
      const emojis = await Gamer.database.models.emoji.find()
      const isEmbed = guildSettings.hibye.welcome.message.startsWith('{')
      const transformed = await Gamer.helpers.transform.variables(
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
          if (embed) await welcomeChannel.createMessage({ embed })
          else await welcomeChannel.createMessage(transformed)
        }
      }
    } catch {}
  }

  // Server logs feature
  // If there is no channel set for logging this cancel
  const logs = guildSettings.moderation.logs
  if (!logs.serverlogs.members.channelID) return

  // Create the base embed that first can be sent to public logs
  const embed = new MessageEmbed()
    .setTitle(language(`moderation/logs:MEMBER_JOINED`))
    .addField(language(`moderation/logs:MEMBER_NAME`), member.mention, true)
    .addField(language(`moderation/logs:USER_ID`), member.id, true)
    .addField(language(`moderation/logs:TOTAL_MEMBERS`), member.guild.memberCount.toString(), true)
    .addField(
      language(`moderation/logs:ACCOUNT_AGE`),
      Gamer.helpers.transform.humanizeMilliseconds(Date.now() - member.user.createdAt)
    )
    .setFooter(`${member.username}#${member.discriminator}`, `https://i.imgur.com/Ya0SXdI.png`)
    .setThumbnail(member.avatarURL)
    .setTimestamp()

  // If public logs are enabled properly then send the embed there
  if (logs.serverlogs.members.addPublicEnabled && logs.publiclogsChannelID)
    sendMessage(logs.publiclogsChannelID, { embed: embed.code })

  // Send the finalized embed to the log channel
  sendMessage(logs.serverlogs.members.channelID, { embed: embed.code })
})
