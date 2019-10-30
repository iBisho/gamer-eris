import { Message, AnyGuildChannel } from 'eris'
import config from '../../../config'

const emojiRegex = /<?(?:(a):)?(\w{2,32}):(\d{17,19})?>?/

export default class {
  // Evaluate if the user is a bot owner or a bot mod
  isBotOwnerOrMod(message: Message) {
    const botMods = config.staff.mods
    const botOwners = config.staff.developers

    return botOwners.includes(message.author.id) || botMods.includes(message.author.id)
  }

  userToChannelName(username: string, discriminator: string) {
    const tag = `${username}#${discriminator}`
    return tag.replace(/^-+|[^\w-]|-+$/g, ``).toLowerCase()
  }

  convertEmoji(emoji: string, type: `id` | `reaction`) {
    const validEmoji = emoji.match(emojiRegex)
    if (!validEmoji) return
    validEmoji.shift()
    const [animated, name, id] = validEmoji
    // TODO: remove the animated if not needed
    console.log(animated)

    switch (type) {
      case `id`:
        return id ? id : undefined
      case `reaction`:
        return name && id ? `${name}:${id}` : undefined
      default:
        return emoji
    }
  }

  checkPermissions(channel: AnyGuildChannel, userID: string, permissions: string[]) {
    return !!permissions.some(permission => !channel.permissionsOf(userID).has(permission))
  }
}
