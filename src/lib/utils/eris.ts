import Gamer from '../..'
import { Message, Member, User } from 'eris'
import { highestRole } from 'helperis'

export async function deleteMessageWithID(channelID: string, messageID: string) {
  // Make sure channel exists
  const channel = Gamer.getChannel(channelID)
  if (!channel) return

  // Don't have perms to fetch message so cancel
  if (!Gamer.helpers.discord.checkPermissions(channel, Gamer.user.id, ['readMessages', 'readMessageHistory'])) return

  // Make sure message is valid
  const message = await Gamer.getMessage(channelID, messageID).catch(() => undefined)
  if (!message) return

  if (message.author.id === Gamer.user.id) {
    Gamer.deleteMessage(channelID, messageID).catch(() => undefined)
  } else {
    if (!Gamer.helpers.discord.checkPermissions(channel, Gamer.user.id, ['manageMessages'])) return

    Gamer.deleteMessage(channelID, messageID).catch(() => undefined)
  }
}

export async function deleteMessage(message: Message, delaySeconds = 0, reason?: string) {
  if (delaySeconds) await Gamer.helpers.utils.sleep(delaySeconds)

  if (message.author.id === Gamer.user.id) {
    message.delete().catch(() => undefined)
    return
  }

  if (!Gamer.helpers.discord.checkPermissions(message.channel, Gamer.user.id, ['manageMessages'])) return

  Gamer.deleteMessage(message.channel.id, message.id, reason).catch(() => undefined)
}

export async function addRoleToMember(member: Member, id: string, reason?: string) {
  const role = member.guild.roles.get(id)
  if (!role) return

  const botMember = await Gamer.helpers.discord.fetchMember(member.guild, Gamer.user.id)
  if (!botMember) return

  const botsHighestRole = highestRole(botMember)

  if (!botMember.permission.has('manageRoles') || botsHighestRole.position <= role.position) return

  Gamer.addGuildMemberRole(member.guild.id, member.id, id, reason)
}

export async function removeRoleFromMember(member: Member, id: string, reason?: string) {
  const role = member.guild.roles.get(id)
  if (!role) return

  const botMember = await Gamer.helpers.discord.fetchMember(member.guild, Gamer.user.id)
  if (!botMember) return

  const botsHighestRole = highestRole(botMember)

  if (!botMember.permission.has('manageRoles') || botsHighestRole.position <= role.position) return

  Gamer.removeGuildMemberRole(member.guild.id, member.id, id, reason)
}

async function fetchUsersFromReaction(message: Message, emoji: string, users: User[] = []): Promise<User[]> {
  const latestUserID = users.length ? users[users.length - 1].id : undefined
  const reactors = await message.getReaction(emoji, 100, undefined, latestUserID)
  users.push(...reactors)
  if (reactors.length === 100) return fetchUsersFromReaction(message, emoji, users)
  return users
}

export async function fetchAllReactors(message: Message) {
  const reactors = new Map<string, User[]>()

  for (const key of Object.keys(message.reactions)) {
    if (['count', 'me'].includes(key)) continue

    const users = await fetchUsersFromReaction(message, key)
    reactors.set(key, users)
  }

  return reactors
}

export async function removeReaction(message: Message, reaction: string, userID: string) {
  if (!message.member) return

  const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!botMember) return

  const hasPermissions = Gamer.helpers.discord.checkPermissions(message.channel, Gamer.user.id, [
    'readMessages',
    'manageMessages',
    'readMessageHistory'
  ])
  if (!hasPermissions) return

  Gamer.removeMessageReaction(message.channel.id, message.id, reaction, userID)
}
