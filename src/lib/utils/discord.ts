import { Message } from 'eris'
import config from '../../../config'

export default class {
  // Evaluate if the user is a bot owner or a bot mod
  public isBotOwnerOrMod(message: Message) {
    const botMods = config.staff.mods
    const botOwners = config.staff.developers

    return botOwners.includes(message.author.id) || botMods.includes(message.author.id)
  }
}
