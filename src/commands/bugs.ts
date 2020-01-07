import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, TextChannel, GroupChannel } from 'eris'
import { FeedbackCollectorData } from '../lib/types/gamer'
import fetch from 'node-fetch'

export default new Command([`bugs`, `bug`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const settings = await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return null

  // If the settings are null then the feedback system is disabled
  if (!settings || !settings.feedback.bugs.channelID)
    return message.channel.createMessage(language(`feedback/bugs:NOT_ACTIVATED`))
  const channel = message.channel.guild.channels.get(settings.feedback.bugs.channelID)
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

  const embed = new GamerEmbed()
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
      guildID: message.channel.guild.id,
      data: {
        language,
        settings,
        embed,
        question
      },
      callback: async (msg, collector) => {
        if (!msg.member || msg.channel instanceof PrivateChannel || msg.channel instanceof GroupChannel) return
        const CANCEL_OPTIONS = language(`common:CANCEL_OPTIONS`, { returnObjects: true })
        if (CANCEL_OPTIONS.includes(msg.content)) {
          message.channel.createMessage(language(`feedback/bugs:CANCELLED`, { mention: msg.author.mention }))
          return
        }

        // The user must have provided some sort of content
        const data = collector.data as FeedbackCollectorData
        const questions = data.settings.feedback.bugs.questions

        // If the user gave some sort of response that we use that
        if (msg.content) embed.addField(data.question, msg.content)
        // If no response was provided but an image was uploaded and this is the last question we use this image
        else if (questions.length === embed.code.fields.length + 1 && msg.attachments.length) {
          const imgbuffer = await fetch(msg.attachments[0].url)
            .then(res => res.buffer())
            .catch(() => undefined)
          if (imgbuffer) embed.attachFile(imgbuffer, 'imageattachment.png')

          // Since this does not add a field we need to end it here as its the last question and without adding a field itll be an infinite loop
          // This was the final question so now we need to post the feedback
          Gamer.helpers.feedback.sendBugReport(message, channel, embed, settings)
          return Gamer.helpers.levels.completeMission(msg.member, `idea`, msg.channel.guild.id)
        }
        // Cancel out as the user is using it wrongly
        else return
        if (embed.code.fields.length === questions.length) {
          // This was the final question so now we need to post the feedback
          Gamer.helpers.feedback.sendBugReport(message, channel, embed, settings)
          return Gamer.helpers.levels.completeMission(msg.member, `bugs`, msg.channel.guild.id)
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

  return
})
