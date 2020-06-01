import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'
import { milliseconds } from '../../lib/types/enums/time'

export default new Command([`upvote`, `vote`], async (message, _args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const prefix = Gamer.guildPrefixes.get(message.guildID) || Gamer.prefix

  const REMINDER = language('basic/upvote:REMINDER', { prefix, id: message.id })
  const [upvote, reminder] = await Promise.all([
    Gamer.database.models.upvote.findOne({ userID: message.author.id }),
    Gamer.database.models.reminder.findOne({
      userID: message.author.id
    })
  ])

  const millisecondsLeft = upvote
    ? Gamer.helpers.transform.humanizeMilliseconds(milliseconds.HOUR * 12 + upvote.timestamp - Date.now())
    : undefined

  const embed = new MessageEmbed()
    .setTitle(language('basic/upvote:CLICK_HERE'), 'https://top.gg/bot/270010330782892032/vote')
    .setDescription(language('basic/upvote:REWARDS', { amount: `**${upvote?.weeklyCount || 0}/20**` }))
    .setFooter(
      language(millisecondsLeft ? `basic/upvote:TIME_LEFT` : `basic/upvote:VOTE_NOW`, { time: millisecondsLeft })
    )

  message.channel.createMessage({ embed: embed.code })

  if (reminder) return

  const reminderCommand = Gamer.commandForName('remind')
  reminderCommand?.execute(message, [`12h5m`, `12h`, REMINDER], context)
})
