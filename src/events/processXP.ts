import Event from '../lib/structures/Event'
import { Message } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Event {
  async execute(message: Message, Gamer: GamerClient) {
    // If a bot or in dm, no XP we want to encourage activity in servers not dms
    if (message.author.bot || !message.member) return

    const guildXP = Gamer.guildsXPPerMessage.get(message.member.guild.id)
    // Update XP for the member locally
    Gamer.helpers.levels.addLocalXP(message.member, guildXP || 1)
    // Update XP for the user globally
    Gamer.helpers.levels.addGlobalXP(message.member, 1)
  }
}
