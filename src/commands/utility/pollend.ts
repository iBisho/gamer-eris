import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'
import { TextChannel, NewsChannel } from 'eris'
import { fetchAllReactors } from '../../lib/utils/eris'
import constants from '../../constants'

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
  const results = []

  const pollChannel = message.member.guild.channels.get(poll.channelID)
  if (!pollChannel) return

  const pollMessage = await (pollChannel as TextChannel).getMessage(poll.messageID).catch(() => undefined)
  if (!pollMessage) return

  const resultsChannel = message.member.guild.channels.get(poll.resultsChannelID)
  if (!resultsChannel || !(resultsChannel instanceof TextChannel && !(resultsChannel instanceof NewsChannel))) return

  const voters = await fetchAllReactors(pollMessage)

  for (const [key, value] of voters.entries()) {
    voters.set(
      key,
      value.filter(user => user.id !== Gamer.user.id)
    )
  }

  let totalVotes = 0

  for (const vote of voters.values()) totalVotes += vote.length

  for (const [key, value] of voters.entries())
    results.push(`${key} ${value.length} | ${(value.length / (totalVotes || 1)) * 100}%`)

  // Delete the poll in the db
  Gamer.database.models.poll.deleteOne({ _id: poll._id }).exec()

  const embed = new MessageEmbed().setTitle(poll.question).setDescription(results.join('\n')).setTimestamp()

  const pollEmbed = new MessageEmbed()
    .setTitle(poll.question)
    .setDescription(poll.options.map((opt, index) => `${constants.emojis.letters[index]} ${opt}`).join('\n'))

  resultsChannel.createMessage({ embed: pollEmbed.code })
  return resultsChannel.createMessage({ embed: embed.code })
})
