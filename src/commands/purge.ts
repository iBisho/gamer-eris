import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'

export default new Command([`purge`, `nuke`, `n`, `prune`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || !message.member) return

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

  const filteredMessages =
    filter && message.mentions.length
      ? messages.filter(msg => message.mentions.some(user => user.id === msg.author.id))
      : messages

  const messagesToDelete = filteredMessages.splice(0, amount)

  message.channel.deleteMessages(messagesToDelete.map(m => m.id))

  const response = await message.channel.createMessage(
    language(`moderation/purge:RESPONSE`, { amount: messagesToDelete.length })
  )
  return setTimeout(() => response.delete().catch(() => undefined), 10000)
})
