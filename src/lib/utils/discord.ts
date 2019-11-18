import { Message, AnyGuildChannel, Member, Role } from 'eris'
import config from '../../../config'
import constants from '../../constants'

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

  convertEmoji(
    emoji: string,
    type: `data`
  ): undefined | { animated: string; name: string; id: string; fullCode: string }
  convertEmoji(emoji: string, type: `id` | `reaction`): undefined | string
  convertEmoji(emoji: string, type: `id` | `reaction` | `data`) {
    const validEmoji = emoji.match(emojiRegex)
    if (!validEmoji) return
    validEmoji.shift()
    const [animated, name, id] = validEmoji

    switch (type) {
      case `id`:
        return id ? id : undefined
      case `reaction`:
        return name && id ? `${name}:${id}` : undefined
      case `data`:
        return {
          animated,
          name,
          id,
          fullCode: `<${animated ? `a` : ``}:${name}:${id}>`
        }
      default:
        return emoji
    }
  }

  checkPermissions(channel: AnyGuildChannel, userID: string, permissions: string[]) {
    return !!permissions.some(permission => !channel.permissionsOf(userID).has(permission))
  }

  idsToUserTag(ids: string[]) {
    return ids.map(id => `<@!${id}>`).join(`, `)
  }

  compareMemberPosition(member: Member, target: Member) {
    let memberHighestRole: Role | undefined
    let targetHighestRole: Role | undefined

    for (const roleID of member.roles) {
      const role = member.guild.roles.get(roleID)
      if (!role) continue
      if (!memberHighestRole || memberHighestRole.position < role.position) memberHighestRole = role
    }

    for (const roleID of target.roles) {
      const role = target.guild.roles.get(roleID)
      if (!role) continue
      if (!targetHighestRole || targetHighestRole.position < role.position) targetHighestRole = role
    }
    // If the member has no role they can't be higher than anyone
    if (!memberHighestRole) return false
    // If the member has a role but the target doesn't they do have perms to manage
    if (!targetHighestRole) return true
    return memberHighestRole.position > targetHighestRole.position
  }

  highestRole(member: Member) {
    let memberHighestRole: Role | undefined

    for (const roleID of member.roles) {
      const role = member.guild.roles.get(roleID)
      if (!role) continue
      if (!memberHighestRole || memberHighestRole.position < role.position) memberHighestRole = role
    }

    const everyoneRole = member.guild.roles.get(member.guild.id) as Role

    return memberHighestRole || everyoneRole
  }

  booleanEmoji(enabled: boolean) {
    return enabled ? constants.emojis.greenTick : constants.emojis.redX
  }
}
