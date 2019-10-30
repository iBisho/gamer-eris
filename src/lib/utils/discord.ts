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

  isModerator(message: Message, roleIDs: string[]) {
    return roleIDs.some(id => message.member && message.member.roles.includes(id))
  }

  // If the roleid is undefined its to also check the admin perm
  isAdmin(message: Message, roleID?: string) {
    return (
      message.member &&
      (message.member.permission.has('administrator') || (roleID && message.member.roles.includes(roleID)))
    )
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
