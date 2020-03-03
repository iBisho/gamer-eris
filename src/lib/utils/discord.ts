import { Message, Member, Role, TextableChannel, PrivateChannel, GroupChannel, Guild } from 'eris'
import config from '../../../config'
import constants from '../../constants'
import GamerEmbed from '../structures/GamerEmbed'
import GamerClient from '../structures/GamerClient'
import { GuildSettings } from '../types/settings'

const emojiRegex = /<?(?:(a):)?(\w{2,32}):(\d{17,19})?>?/

export default class {
  embedResponse(message: Message, text: string) {
    const embed = new GamerEmbed()
      .setAuthor(
        `${message.member?.nick || message.author.username}#${message.author.discriminator}`,
        message.author.avatarURL
      )
      .setDescription(text)

    return message.channel.createMessage({ embed: embed.code })
  }

  // Evaluate if the user is a bot owner or a bot mod
  isBotOwnerOrMod(message: Message) {
    const botMods = config.staff.mods
    const botOwners = config.staff.developers

    return botOwners.includes(message.author.id) || botMods.includes(message.author.id)
  }

  isModerator(message: Message, roleIDs: string[] = []) {
    return roleIDs.some(id => message.member && message.member.roles.includes(id))
  }

  // If the roleid is undefined its to also check the admin perm
  isAdmin(message: Message, roleID?: string) {
    return (
      message.member &&
      (message.member.permission.has('administrator') || (roleID && message.member.roles.includes(roleID)))
    )
  }

  isModOrAdmin(message: Message, settings: GuildSettings | null) {
    return this.isAdmin(message, settings?.staff.adminRoleID) || this.isModerator(message, settings?.staff.modRoleIDs)
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

  checkPermissions(channel: TextableChannel, userID: string, permissions: string[]) {
    if (channel instanceof PrivateChannel || channel instanceof GroupChannel) return false
    const perms = channel.permissionsOf(userID)
    return permissions.every(permission => perms.has(permission))
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

  async fetchMember(guild: Guild, id: string) {
    const userID = id.startsWith('<@') ? id.substring(id.startsWith('<@!') ? 3 : 2, id.length - 1) : id

    const cachedMember = guild.members.get(userID)
    if (cachedMember) return cachedMember

    const member = await guild.shard.client.getRESTGuildMember(guild.id, userID).catch(() => undefined)

    // Fetch all members behind the scene so next time bot needs a member for this guild it will be cached
    guild.fetchAllMembers()

    return member
  }

  async fetchUser(Gamer: GamerClient, id: string) {
    const userID = id.startsWith('<@') ? id.substring(id.startsWith('<@!') ? 3 : 2, id.length - 1) : id

    const cachedUser = Gamer.users.get(userID)
    if (cachedUser) return cachedUser

    const user = await Gamer.getRESTUser(userID).catch(() => undefined)
    if (user) Gamer.users.add(user)

    return user
  }
}
