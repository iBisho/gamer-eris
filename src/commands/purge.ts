import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'
import { milliseconds } from '../lib/types/enums/time'

export default new Command([`purge`, `nuke`, `n`, `prune`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient
  const botMember = message.channel.guild.members.get(Gamer.user.id)
  if (!botMember) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  // Check if the bot has the kick permissions
  if (!message.channel.permissionsOf(Gamer.user.id).has('manageMessages'))
    return message.channel.createMessage(language(`moderation/kick:NEED_MANAGE_MESSAGE`))

  if (!message.channel.permissionsOf(message.member.id).has('manageMessages'))
    return message.channel.createMessage(language(`moderation/purge:MISSING_PERM`))

  const [number, filter] = args
  const amount = parseInt(number || '20', 10) || 20

  const messages = await message.channel.getMessages(500)

  const now = Date.now()
  const maxAge = milliseconds.WEEK * 2

  const filteredMessages = messages.filter(msg => {
    // Discord does not allow deleting messages over 2 weeks old
    if (now - msg.timestamp > maxAge) return false
    // if users were mentioned we remove any message that isn't one of theirs
    if (message.mentions.some(user => user.id === msg.author.id)) return false
    // Check the filter types
    if (filter === `links`) return /https?:\/\/[^ /.]+\.[^ /.]+/.test(msg.content)
    if (filter === `invites`)
      return /(https?:\/\/)?(www\.)?(discord\.(gg|li|me|io)|discordapp\.com\/invite)\/.+/.test(msg.content)
    if (filter === `bots`) return msg.author.bot
    if (filter === `upload` || filter === 'images') return msg.attachments.length
    return true
  })

  const messagesToDelete = filteredMessages.splice(0, amount + 1)

  message.channel.deleteMessages(messagesToDelete.map(m => m.id))

  const response = await message.channel.createMessage(
    language(`moderation/purge:RESPONSE`, { amount: messagesToDelete.length - 1 })
  )
  return setTimeout(() => response.delete().catch(() => undefined), 10000)
})
