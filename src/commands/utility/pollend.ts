import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { processPollResults } from '../../lib/utils/poll'

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
  return processPollResults(poll, message.member.guild)
})
