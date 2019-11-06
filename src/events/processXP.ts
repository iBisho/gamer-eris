import Event from '../lib/structures/Event'
import { PrivateChannel, Message } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'
import GuildDefaults from '../constants/settings/guild'

export default class extends Event {
  async execute(message: Message, Gamer: GamerClient) {
    // If a bot or in dm, no XP we want to encourage activity in servers not dms
    if (message.channel instanceof PrivateChannel || message.author.bot || !message.member) return

    const guildSettings =
      ((await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) as GuildSettings | null) ||
      GuildDefaults

    const language = Gamer.i18n.get(guildSettings.language)
    if (!language) return

    // Update XP for the member locally
    Gamer.helpers.levels.addLocalXP(
      message.member,
      language(`leveling/xp:ROLE_ADD_REASON`),
      guildSettings.xp.perMessage
    )
    // Update XP for the member globally
    Gamer.helpers.levels.addGlobalXP(message.member, 1)
  }
}
