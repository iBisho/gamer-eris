import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`move`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  // Check if the bot has the Move Members permissions
  if (!message.channel.permissionsOf(Gamer.user.id).has('voiceMoveMembers'))
    return message.channel.createMessage(language(`moderation/move:NEED_MOVE_MEMBERS`))

  if (!message.channel.permissionsOf(message.member.id).has('voiceMoveMembers'))
    return message.channel.createMessage(language(`moderation/move:MISSING_PERM`))

  const channelID = message.channel.guild.channels.get(args[0])?.id
  if (!channelID) return message.channel.createMessage(language(`moderation/move:NEED_CHANNEL`))

  if (!message.mentions.length) return message.channel.createMessage(language(`moderation/move:NEED_MEMBERS`))

  let amount = 0
  for (const i in args.slice(1)) {
    const member = message.channel.guild.members.get(message.mentions[i]?.id)
    if (!member) continue
    member.edit({ channelID: channelID }, `moved by ${message.author.username}#${message.author.discriminator}`)
    amount++
  }

  return message.channel.createMessage(language(`moderation/move:SUCESS`, { amount }))
})
