// This monitor will automatically assign the auto assign roles to a user when they send a message and dont have that role.
// This is because by default forcibly adding a role to a user overrides the built in discord verification.
import Monitor from '../lib/structures/Monitor'
import { Message, GuildChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    // If has roles then this monitor is useless. Every user has everyone role so must be more than 1.
    // This will also end up checking if they have the auto role already
    // The message type helps ignore other messages like discord default welcome messages
    if (!message.guildID || message.type !== 0 || !message.member || message.member.roles.length > 1) return

    const bot = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
    if (!bot || !bot.permission.has('manageRoles')) return

    const highestRole = Gamer.helpers.discord.highestRole(bot)

    // Get the verification category id so we dont assign the role while they are chatting in verification
    const guildSettings = await Gamer.database.models.guild.findOne({
      id: message.guildID
    })
    // If the guild has default settings then they dont have verification or autorole enabled
    if (!guildSettings) return

    const language = Gamer.getLanguage(message.guildID)

    if (
      !guildSettings.moderation.roleIDs.autorole ||
      (message.channel as GuildChannel).parentID === guildSettings.verify.categoryID
    )
      return

    const autorole = message.member.guild.roles.get(guildSettings.moderation.roleIDs.autorole)
    if (!autorole || autorole.position >= highestRole.position) return

    Gamer.amplitude.push({
      authorID: message.author.id,
      channelID: message.channel.id,
      guildID: message.guildID,
      messageID: message.id,
      timestamp: message.timestamp,
      memberID: message.member.id,
      type: 'ROLE_ADDED'
    })

    return message.member.addRole(guildSettings.moderation.roleIDs.autorole, language(`basic/verify:AUTOROLE_ASSIGNED`))
  }
}
