import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { milliseconds } from '../../lib/types/enums/time'
import { GuildTextableChannel } from 'eris'

export default new Command([`purge`, `nuke`, `n`, `prune`, `clear`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!botMember) return

  const language = Gamer.getLanguage(message.guildID)

  const channel = message.channel as GuildTextableChannel
  // Check if the bot has the kick permissions
  if (!channel.permissionsOf(Gamer.user.id).has('manageMessages'))
    return message.channel.createMessage(language(`moderation/kick:NEED_MANAGE_MESSAGE`))

  if (!channel.permissionsOf(message.member.id).has('manageMessages'))
    return message.channel.createMessage(language(`moderation/purge:MISSING_PERM`))

  const [number, filter] = args
  const amount = parseInt(number || '20', 10) || 20

  const messages = await message.channel.getMessages(500)

  const now = Date.now()
  const maxAge = milliseconds.WEEK * 2

  const filteredMessages = messages.filter(msg => {
    // Always delete the nuke command message
    if (message.id === msg.id) return true
    // Discord does not allow deleting messages over 2 weeks old
    if (now - msg.timestamp > maxAge) return false
    // if users were mentioned we remove their messages
    if (message.mentions.length) return message.mentions.some(user => user.id === msg.author.id)
    // If the filter is a user ID useful when user is gone and cant @
    if (args.includes(msg.author.id)) return true
    // Check the filter types
    if (filter === `links`) return /https?:\/\/[^ /.]+\.[^ /.]+/.test(msg.content)
    if (filter === `invites`)
      return /(https?:\/\/)?(www\.)?(discord\.(gg|li|me|io)|discordapp\.com\/invite)\/.+/.test(msg.content)
    if (filter === `bots`) return msg.author.bot
    if (filter === `upload` || filter === 'images') return msg.attachments.length
    return true
  })

  const messagesToDelete = filteredMessages.splice(0, amount + 1)

  channel.deleteMessages(messagesToDelete.map(m => m.id)).catch(() => undefined)

  const response = await message.channel.createMessage(
    language(`moderation/purge:RESPONSE`, { amount: messagesToDelete.length - 1 })
  )
  return setTimeout(() => response.delete().catch(() => undefined), 10000)
})
