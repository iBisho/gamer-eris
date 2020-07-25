import Gamer from '../..'
import { GamerPoll } from '../../database/schemas/poll'
import { TextChannel, NewsChannel, Guild } from 'eris'
import { fetchAllReactors } from './eris'
import { MessageEmbed } from 'helperis'
import constants from '../../constants'
import { round } from 'mathjs'

export async function processPollResults(poll: GamerPoll, guild: Guild) {
  const results = []

  const pollChannel = guild.channels.get(poll.channelID)
  if (!pollChannel) return

  const pollMessage = await (pollChannel as TextChannel).getMessage(poll.messageID).catch(() => undefined)
  if (!pollMessage) return

  const resultsChannel = guild.channels.get(poll.resultsChannelID)
  if (!resultsChannel || !(resultsChannel instanceof TextChannel && !(resultsChannel instanceof NewsChannel))) return

  const voters = await fetchAllReactors(pollMessage)

  for (const vote of poll.anonymousVotes) {
    for (const opt of vote.options) {
      const emoji = constants.emojis.letters[opt]
      if (!emoji) continue

      const relevantVoters = voters.get(emoji)
      if (!relevantVoters) continue

      if (relevantVoters.some(user => user.id === vote.userID)) continue

      const user = await Gamer.helpers.discord.fetchUser(vote.userID)
      if (!user) continue

      relevantVoters.push(user)
    }
  }

  let totalVotes = 0

  for (const users of voters.values()) {
      if (users.some(user => user.id === Gamer.user.id)) totalVotes += users.length - 1
      else totalVotes += users.length
  }

  for (const [key, users] of voters.entries()) {
      results.push(`${key} ${users.length - 1} | ${round(((users.length - 1) / (totalVotes)) * 100, 1)}%`)
  }

  // Delete the poll in the db
  Gamer.database.models.poll.deleteOne({ _id: poll._id }).exec()

  const embed = new MessageEmbed().setTitle(poll.question).setDescription(results.join('\n')).setTimestamp()

  const pollEmbed = new MessageEmbed()
    .setTitle(poll.question)
    .setDescription(poll.options.map((opt, index) => `${constants.emojis.letters[index]} ${opt}`).join('\n'))

  resultsChannel.createMessage({ embed: pollEmbed.code })
  return resultsChannel.createMessage({ embed: embed.code })
}

export async function processPolls() {
  const polls = await Gamer.database.models.poll.find({ endsAt: { $lt: Date.now() } })
  if (!polls.length) return

  polls.forEach(poll => {
    // If the endsAt is 0 the poll should not expire
    if (!poll.endsAt) return

    const guild = Gamer.guilds.get(poll.guildID)
    if (!guild) return

    processPollResults(poll, guild)
  })
}
