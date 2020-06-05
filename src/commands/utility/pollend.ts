import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'
import { TextChannel } from 'eris'

export default new Command(['pollend', 'pe'], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.member.guild.id)

  const [id] = args
  const pollID = Number(id)

  if (!pollID) return message.channel.createMessage(language('utility/pollvote:INVALID_POLL_ID'))

  const settings = await Gamer.database.models.guild.findOne({ id: message.member.guild.id })
  if (!Gamer.helpers.discord.isModOrAdmin(message, settings))
    return message.channel.createMessage(language('common:NOT_MOD_OR_ADMIN'))

  const poll = await Gamer.database.models.poll.findOne({ pollID, guildID: message.member.guild.id })
  if (!poll) return message.channel.createMessage(language('utility/pollvote:NO_POLL_FOUND'))

  // Calculate results: Option | # | %
  // const results = []

  const latestUserID = ''

  const pollChannel = message.member.guild.channels.get(poll.channelID)
  if (!pollChannel) return

  const pollMessage = await (pollChannel as TextChannel).getMessage(poll.messageID).catch(() => undefined)
  if (!pollMessage) return

  for (const key of Object.keys(pollMessage.reactions)) {
    console.log('key', key)
    if (['count', 'me'].includes(key)) continue

    console.log(key)
    const reactions = latestUserID
      ? await message.getReaction(encodeURIComponent(key), 100, latestUserID)
      : await message.getReaction(encodeURIComponent(key))

    console.log('reactions', reactions)
  }

  // const embed = new MessageEmbed().setTitle(poll.question).setDescription(poll.options)

  // Post results in the results channel
  return MessageEmbed
})
