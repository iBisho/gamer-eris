import Event from '../lib/structures/Event'
import { Message } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Event {
  async execute(message: Message, Gamer: GamerClient) {
    // If a bot or in dm, no XP we want to encourage activity in servers not dms
    if (message.author.bot || !message.member) return

    // Update XP for the member locally
    Gamer.helpers.levels.addLocalXP(message.member, 1)
    // Update XP for the user globally
    Gamer.helpers.levels.addGlobalXP(message.member, 1)
  }
}
