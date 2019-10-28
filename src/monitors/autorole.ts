// This monitor will automatically assign the auto assign roles to a user when they send a message and dont have that role.
// This is because by default forcibly adding a role to a user overrides the built in discord verification.
import Monitor from '../lib/structures/Monitor'
import { Message, PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'

export default class extends Monitor {
  async run(message: Message, Gamer: GamerClient) {
    // If has roles then this monitor is useless. Every user has everyone role so must be more than 1.
    // This will also end up checking if they have the auto role already
    // The message type helps ignore other messages like discord default welcome messages
    if (
      message.channel instanceof PrivateChannel ||
      message.type !== 0 ||
      (message.member && message.member.roles.length > 1)
    )
      return

    // Get the verification category id so we dont assign the role while they are chatting in verification
    const guildSettings = (await Gamer.database.models.guild.findOne({
      id: message.channel.guild.id
    })) as GuildSettings | null
    // If the guild has default settings then they dont have verification or autorole enabled
    if (!guildSettings) return

    const language = Gamer.i18n.get(guildSettings.language)
    if (!language) return

    if (!guildSettings.moderation.roleIDs.autorole || message.channel.parentID === guildSettings.verify.categoryID)
      return

    const bot = message.channel.guild.members.get(Gamer.user.id)
    if (!bot || !bot.permission.has('manageRoles')) return

    return (
      message.member &&
      message.member.addRole(guildSettings.moderation.roleIDs.autorole, language(`basic/verify:AUTOROLE_ASSIGNED`))
    )
  }
}
