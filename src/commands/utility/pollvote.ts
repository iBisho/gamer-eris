import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { deleteMessage } from '../../lib/utils/eris'

export default new Command(['pollvote', 'pv'], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const [id, vote] = args

  // This command is meant to be private stuff. Anonymous voting.
  deleteMessage(message)

  const pollID = Number(id)
  const voteID = Number(vote)
  const language = Gamer.getLanguage(message.member.guild.id)

  if (!pollID) return message.channel.createMessage(language('utility/pollvote:INVALID_POLL_ID'))
  if (!voteID) return message.channel.createMessage(language('utility/pollvote:INVALID_VOTE_ID'))

  const poll = await Gamer.database.models.poll.findOne({ guildID: message.member.guild.id, pollID })
  if (!poll) return message.channel.createMessage(language('uility/pollvote:NO_POLL_FOUND'))

  if (voteID > poll.options.length) return message.channel.createMessage(language('utility/pollvote:NO_VOTE_FOUND'))

  const voted = poll.anonymousVotes.find(v => v.userID === message.author.id)
  if (!voted) {
    poll.anonymousVotes.push({
      userID: message.author.id,
      options: [voteID]
    })
    message.channel.createMessage(language('utility/pollvote:VOTED'))
  } else if (voted.options.includes(voteID)) {
    voted.options = voted.options.filter(opt => opt !== voteID)
    message.channel.createMessage(language('utility/pollvote:VOTE_REMOVED'))
  } else {
    voted.options.push(voteID)
    message.channel.createMessage(language('utility/pollvote:VOTED'))
  }

  poll.save()
  return
})
