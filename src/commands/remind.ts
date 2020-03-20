import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(
  [`remind`, `remindme`, `remindcreate`, `rc`, `remindcreate`, `remindercreate`],
  async (message, args, context) => {
    if (!message.guildID || !message.member) return

    const Gamer = context.client as GamerClient

    const helpCommand = Gamer.commandForName('help')
    if (!args.length) return helpCommand?.process(message, ['remind'], context)

    const language = Gamer.getLanguage(message.guildID)

    const [time] = args
    if (time?.toLowerCase() === 'list') {
      console.log('inside list')
      const reminders = await Gamer.database.models.reminder.find({ userID: message.author.id })
      return Gamer.helpers.discord.embedResponse(
        message,
        reminders
          .map(
            reminder =>
              `**${reminder.id}: ${Gamer.helpers.transform.humanizeMilliseconds(
                reminder.timestamp - Date.now()
              )}** => ${reminder.content}`
          )
          .join('\n')
      )
    }

    const startNow = Gamer.helpers.transform.stringToMilliseconds(time)
    if (!startNow) return helpCommand?.process(message, ['remind'], context)

    // Removes the time from the args leaving only the description
    args.shift()
    if (!args.length) return helpCommand?.process(message, ['remind'], context)

    const [repeat] = args
    let recurring = false
    const interval = Gamer.helpers.transform.stringToMilliseconds(repeat)
    if (interval) {
      recurring = true
      args.shift()
      if (!args.length) return helpCommand?.process(message, ['remind'], context)
    }

    message.channel.createMessage(language('events/remind:CREATED', { mention: message.author.mention }))

    Gamer.database.models.reminder.create({
      id: message.id,
      guildID: message.guildID,
      channelID: message.channel.id,
      userID: message.author.id,
      recurring,
      content: args.join(' '),
      timestamp: Date.now() + startNow,
      interval
    })
  }
)
