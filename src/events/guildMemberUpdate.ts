import Event from '../lib/structures/Event'
import { TextChannel, Member, Guild } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'
import constants from '../constants'

export interface OldMember {
  roles?: string[]
  nick?: string
}

export default class extends Event {
  async execute(guild: Guild, member: Member, oldMember: OldMember | null) {
    // Make sure that oldMember was always cached and exists to be able to compare it
    if (!oldMember) return

    const Gamer = guild.shard.client as GamerClient
    const botMember = guild.members.get(Gamer.user.id)
    if (!botMember) return

    const language = Gamer.i18n.get(Gamer.guildLanguages.get(guild.id) || `en-US`)
    if (!language) return

    const guildSettings = await Gamer.database.models.guild.findOne({ id: guild.id })

    const embed = new GamerEmbed()
      .setTitle(language(`moderation/logs:MEMBER_UPDATED`))
      .addField(language(`moderation/logs:NAME`), member.mention, true)
      .addField(language(`moderation/logs:USER_ID`), member.id, true)
      .setFooter(`${member.username}#${member.discriminator}`, guild.iconURL)
      .setThumbnail(member.user.avatarURL)
      .setTimestamp()

    // Nickname changed

    if (guildSettings && member.nick !== oldMember.nick && guildSettings.moderation.logs.serverlogs.members.channelID) {
      embed.addField(language(`moderation/logs:NICKNAME`), `${oldMember.nick} **=>** ${member.nick}`, true)

      const logs = guildSettings.moderation.logs
      // If public logs are enabled properly then send the embed there
      if (logs.serverlogs.members.nicknamePublicEnabled && logs.publiclogsChannelID) {
        const publicLogChannel = guild.channels.get(logs.publiclogsChannelID)
        if (publicLogChannel && publicLogChannel instanceof TextChannel) {
          const botPerms = publicLogChannel.permissionsOf(Gamer.user.id)
          if (botPerms.has('embedLinks') && botPerms.has('readMessages') && botPerms.has('sendMessages'))
            publicLogChannel.createMessage({ embed: embed.code })
        }
      }

      const logChannel = guild.channels.get(guildSettings.moderation.logs.serverlogs.members.channelID)
      if (logChannel && logChannel instanceof TextChannel) {
        const botPerms = logChannel.permissionsOf(Gamer.user.id)
        if (botPerms.has(`embedLinks`) && botPerms.has(`readMessages`) && botPerms.has(`sendMessages`))
          logChannel.createMessage({ embed: embed.code })
      }
    }

    // If no role changes cancel out
    if (!oldMember.roles || member.roles.length === oldMember.roles.length) return

    const roleAdded = member.roles.length > oldMember.roles.length
    // Find the role that was added/removed
    const roleID = roleAdded
      ? member.roles.find(id => !oldMember?.roles?.some(roleid => roleid === id))
      : oldMember.roles.find(id => !member.roles.some(roleid => roleid === id))
    if (!roleID) return

    // Handle Unique Role Sets
    if (roleAdded) this.handleRoleSets(Gamer, guild, member, roleID)
    // If the role was the VIP nitro role then remove VIP status on all registered guilds
    else if (roleID === constants.general.nitroBoosterRoleID) this.handleVIPRole(Gamer, member)

    // Handle Role messages
    this.handleRoleMessages(Gamer, guild, member, roleID, roleAdded)

    // Server logs feature

    // If there is no channel set for logging this cancel
    if (!guildSettings?.moderation.logs.serverlogs.roles.channelID) return

    embed.addField(
      language(`moderation/logs:ROLE_UPDATED`),
      language(`moderation/logs:ROLE_UPDATED_DETAILS`, {
        type: language(roleAdded ? `moderation/logs:GAINED` : `moderation/logs:LOST`),
        role: `<@&${roleID}>`
      }),
      true
    )

    const logs = guildSettings.moderation.logs

    // If public logs are enabled properly then send the embed there
    if (logs.serverlogs.roles.memberPublicEnabled && logs.publiclogsChannelID) {
      const publicLogChannel = guild.channels.get(logs.publiclogsChannelID)
      if (publicLogChannel instanceof TextChannel) {
        const botPerms = publicLogChannel.permissionsOf(Gamer.user.id)
        if (
          publicLogChannel &&
          botPerms.has('embedLinks') &&
          botPerms.has('readMessages') &&
          botPerms.has('sendMessages')
        )
          publicLogChannel.createMessage({ embed: embed.code })
      }
    }

    // Send the finalized embed to the log channel
    const logChannel = guild.channels.get(guildSettings.moderation.logs.serverlogs.roles.channelID)
    if (logChannel && logChannel instanceof TextChannel) {
      const botPerms = logChannel.permissionsOf(Gamer.user.id)
      if (botPerms.has(`embedLinks`) && botPerms.has(`readMessages`) && botPerms.has(`sendMessages`))
        logChannel.createMessage({ embed: embed.code })
    }
  }

  async handleRoleSets(Gamer: GamerClient, guild: Guild, member: Member, roleID: string) {
    // Check bot perms
    const botMember = guild.members.get(Gamer.user.id)
    if (!botMember) return

    const botsHighestRole = Gamer.helpers.discord.highestRole(botMember)

    if (!botMember.permission.has('manageRoles')) return
    const rolesets = await Gamer.database.models.roleset.find({ guildID: member.guild.id })

    const roleIDsToRemove: string[] = []

    for (const roleset of rolesets) {
      // If this roleset does not contain the changed role skip
      if (!roleset.roleIDs.includes(roleID)) continue

      for (const id of roleset.roleIDs) {
        // Skip any role the user does not have and the role that was just given
        if (id === roleID || !member.roles.includes(id)) continue

        // Make sure the bots role is high enough to manage this role
        const role = guild.roles.get(id)
        if (!role) continue
        if (botsHighestRole.position <= role.position) continue

        if (!roleIDsToRemove.includes(id)) roleIDsToRemove.push(id)
      }
    }

    if (!roleIDsToRemove.length) return

    // Remove all roles with 1 api call
    member.edit({ roles: member.roles.filter(id => !roleIDsToRemove.includes(id)) })
  }

  async handleVIPRole(Gamer: GamerClient, member: Member) {
    const userSettings = await Gamer.database.models.user.findOne({ userID: member.id })
    if (!userSettings) return
    // Remove vip settings for all guilds this user registered
    for (const guildID of userSettings.vip.guildsRegistered) {
      const vipGuildSettings = await Gamer.database.models.guild.findOne({ id: guildID })
      if (!vipGuildSettings) continue
      vipGuildSettings.vip.isVIP = false
      vipGuildSettings.save()
    }
  }

  async handleRoleMessages(Gamer: GamerClient, guild: Guild, member: Member, roleID: string, roleAdded: boolean) {
    const roleMessage = await Gamer.database.models.roleMessages.findOne({ roleID, roleAdded })
    if (!roleMessage) return

    const channel = guild.channels.get(roleMessage.channelID)
    if (!channel || !(channel instanceof TextChannel)) return

    const botPerms = channel.permissionsOf(Gamer.user.id)
    if (!botPerms.has('readMessages') || !botPerms.has('sendMessages') || !botPerms.has('embedLinks')) return

    const transformed = Gamer.helpers.transform.variables(roleMessage.message)

    if (!roleMessage.message.startsWith('{')) return channel.createMessage(`${member.mention} ${transformed}`)

    try {
      const embed = JSON.parse(transformed)
      channel.createMessage({ content: member.mention, embed })
    } catch {}

    return
  }
}
