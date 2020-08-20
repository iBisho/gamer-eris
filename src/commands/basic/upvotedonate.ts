import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`upvotedonate`, `votedonate`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const [user] = message.mentions
  if (!user || user.bot) return message.channel.createMessage(language(`basic/upvotedonate:NEED_USER`))

  if (user.id === message.author.id) return message.channel.createMessage('basic/upvotedonate:NOT_SELF')

  const [number, possible] = args
  const amount = Number(number) || Number(possible) || 1

  const [authorVotes, userVotes] = await Promise.all([
    Gamer.database.models.upvote.findOne({ userID: message.author.id }),
    Gamer.database.models.upvote.findOne({ userID: user.id })
  ])

  if (!authorVotes || authorVotes.amount === 0 || !userVotes)
    return message.channel.createMessage(language('basic/upvotedonate:VOTE_FIRST'))

  const subtotal = authorVotes.amount < amount ? authorVotes.amount : amount

  Gamer.database.models.upvote
    .findOneAndUpdate({ userID: message.author.id }, { amount: authorVotes.amount - subtotal })
    .exec()
  Gamer.database.models.upvote.findOneAndUpdate({ userID: user.id }, { amount: userVotes.amount + subtotal }).exec()

  return message.channel.createMessage(language('basic/upvotedonate:DONATED'))
})
