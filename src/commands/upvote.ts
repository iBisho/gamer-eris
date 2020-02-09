import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { milliseconds } from '../lib/types/enums/time'

export default new Command([`upvote`, `vote`], async (message, _args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const REMINDER = language('basic/upvote:REMINDER')
  const [upvote, reminder] = await Promise.all([
    Gamer.database.models.upvote.findOne({ userID: message.author.id }),
    Gamer.database.models.reminder.findOne({
      userID: message.author.id,
      content: REMINDER
    })
  ])

  const millisecondsLeft = upvote
    ? Gamer.helpers.transform.humanizeMilliseconds(Date.now() - (upvote?.timestamp + milliseconds.HOUR * 12))
    : undefined

  const embed = new GamerEmbed()
    .setTitle(language('basic/upvote:CLICK_HERE'), 'https://top.gg/bot/270010330782892032/vote')
    .setDescription(language('basic/upvote:REWARDS', { amount: `**${upvote?.weeklyCount || 0}/20**` }))
    .setFooter(
      language(millisecondsLeft ? `basic/upvote:TIME_LEFT` : `basic/upvote:VOTE_NOW`, { time: millisecondsLeft })
    )

  message.channel.createMessage({ embed: embed.code })

  if (reminder) return

  const reminderCommand = Gamer.commandForName('remind')
  reminderCommand?.process(message, [`12h5m`, `12h`, REMINDER], context)
})
