import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'
import { TextChannel } from 'eris'
import { FeedbackCollectorData } from '../../lib/types/gamer'
import fetch from 'node-fetch'

export default new Command([`bugs`, `bug`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const settings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })

  const language = Gamer.getLanguage(message.guildID)

  // If the settings are null then the feedback system is disabled
  if (!settings || !settings.feedback.bugs.channelID)
    return message.channel.createMessage(language(`feedback/bugs:NOT_ACTIVATED`))
  const channel = message.member.guild.channels.get(settings.feedback.bugs.channelID)
  if (!channel || !(channel instanceof TextChannel))
    return message.channel.createMessage(language(`feedback/bugs:INVALID_CHANNEL`))
  // Check all necessary permissions in the bugs channel
  if (!channel.permissionsOf(Gamer.user.id).has('sendMessages'))
    return message.channel.createMessage(language(`feedback/bugs:MISSING_SEND`))
  if (!channel.permissionsOf(Gamer.user.id).has('embedLinks'))
    return message.channel.createMessage(language(`feedback/bugs:MISSING_EMBED`))
  if (!channel.permissionsOf(Gamer.user.id).has('addReactions'))
    return message.channel.createMessage(language(`feedback/bugs:MISSING_REACT`))
  if (!channel.permissionsOf(Gamer.user.id).has('readMessageHistory'))
    return message.channel.createMessage(language(`feedback/bugs:MISSING_HISTORY`))
  if (!channel.permissionsOf(Gamer.user.id).has('externalEmojis'))
    return message.channel.createMessage(language(`feedback/bugs:MISSING_EXTERNAL`))

  if (!settings.feedback.bugs.questions.length)
    return message.channel.createMessage(language(`feedback/bugs:NO_QUESTIONS`))

  const embed = new MessageEmbed()
    .setThumbnail(message.author.avatarURL)
    .setColor(`#F44A41`)
    .setAuthor(
      language(`feedback/bugs:FROM`, { user: `${message.author.username}#${message.author.discriminator}` }),
      message.author.avatarURL
    )
    .setTimestamp()

  const splitContent = args.join(' ').split(` | `)

  for (const [index, question] of settings.feedback.bugs.questions.entries()) {
    if (splitContent.length && splitContent[index]) {
      embed.addField(question, splitContent[index])
      continue
    }

    if (message.attachments.length) {
      const [attachment] = message.attachments
      const buffer = await fetch(attachment.url)
        .then(res => res.buffer())
        .catch(() => undefined)
      if (buffer) embed.attachFile(buffer, 'imageattachment.png')
    }

    await message.channel.createMessage(`${message.author.mention}, ${question}`)
    // Need to get responses from the users
    // Cancel the command and await for the collector
    return Gamer.collectors.set(message.author.id, {
      authorID: message.author.id,
      channelID: message.channel.id,
      createdAt: Date.now(),
      guildID: message.guildID,
      data: {
        language,
        settings,
        embed,
        question
      },
      callback: async (msg, collector) => {
        if (!msg.member || !msg.guildID) return
        const CANCEL_OPTIONS = language(`common:CANCEL_OPTIONS`, { returnObjects: true })
        if (CANCEL_OPTIONS.includes(msg.content)) {
          message.channel.createMessage(language(`feedback/bugs:CANCELLED`, { mention: msg.author.mention }))
          return
        }

        // The user must have provided some sort of content
        const data = collector.data as FeedbackCollectorData
        const questions = data.settings.feedback.bugs.questions

        if (msg.attachments.length) {
          const imgbuffer = await fetch(msg.attachments[0].url)
            .then(res => res.buffer())
            .catch(() => undefined)
          if (imgbuffer) embed.attachFile(imgbuffer, 'imageattachment.png')
        }

        if (msg.content) embed.addField(data.question, msg.content)
        // There was no content NOR attachment
        else if (!msg.attachments.length) return

        if (data.question === questions[questions.length - 1]) {
          // This was the final question so now we need to post the feedback
          Gamer.helpers.feedback.sendBugReport(message, channel, embed, settings)
          return Gamer.helpers.levels.completeMission(msg.member, `bugs`, msg.guildID)
        }

        // If more questions create another collector
        const currentIndex = questions.findIndex(q => data.question === q)
        // Something is very wrong quit out
        if (currentIndex < 0) return

        const nextQuestion = questions[currentIndex + 1]
        // Send the message asking the user next question
        message.channel.createMessage(`${message.author.mention}, ${nextQuestion}`)
        // Update the collectors data
        collector.createdAt = Date.now()
        if (collector.data) data.question = nextQuestion
        Gamer.collectors.set(message.author.id, collector)
      }
    })
  }

  Gamer.helpers.feedback.sendBugReport(message, channel, embed, settings)
  return Gamer.helpers.levels.completeMission(message.member, `idea`, message.guildID)
})
