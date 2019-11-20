import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, TextChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'
import { FeedbackCollectorData } from '../lib/types/gamer'

export default new Command(`idea`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || !message.member) return

  const settings = (await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) as GuildSettings | null

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  // If the settings are null then the feedback system is disabled
  if (!settings || !settings.feedback.idea.channelID)
    return message.channel.createMessage(language(`feedback/idea:NOT_ACTIVATED`))

  const channel = message.channel.guild.channels.get(settings.feedback.idea.channelID)
  if (!channel || !(channel instanceof TextChannel))
    return message.channel.createMessage(language(`feedback/idea:INVALID_CHANNEL`))

  // Check all necessary permissions in the idea channel
  if (!channel.permissionsOf(Gamer.user.id).has('sendMessages'))
    return message.channel.createMessage(language(`feedback/idea:MISSING_SEND`))
  if (!channel.permissionsOf(Gamer.user.id).has('embedLinks'))
    return message.channel.createMessage(language(`feedback/idea:MISSING_EMBED`))
  if (!channel.permissionsOf(Gamer.user.id).has('addReactions'))
    return message.channel.createMessage(language(`feedback/idea:MISSING_REACT`))
  if (!channel.permissionsOf(Gamer.user.id).has('readMessageHistory'))
    return message.channel.createMessage(language(`feedback/idea:MISSING_HISTORY`))
  if (!channel.permissionsOf(Gamer.user.id).has('externalEmojis'))
    return message.channel.createMessage(language(`feedback/idea:MISSING_EXTERNAL`))

  const content = args.join(' ')
  if (!settings.feedback.idea.questions.length)
    return message.channel.createMessage(language(`feedback/idea:NO_QUESTIONS`))
  if (!content) return message.channel.createMessage(language(`feedback/idea:NO_CONTENT`))

  const embed = new GamerEmbed()
    .setThumbnail(message.author.avatarURL)
    .setColor(`#F44A41`)
    .setAuthor(
      language(`feedback/idea:FROM`, { user: `${message.author.username}#${message.author.discriminator}` }),
      message.author.avatarURL
    )
    .setTimestamp()

  const splitContent = content.split(` | `)

  for (const [index, question] of settings.feedback.idea.questions.entries()) {
    if (splitContent.length && splitContent[index]) {
      embed.addField(question, splitContent[index])
      continue
    }

    if (index === 0 && content.length) {
      embed.addField(question, content)
      continue
    }

    if (message.attachments.length) {
      const [attachment] = message.attachments
      embed.setImage(attachment.url)
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
        if (msg.channel instanceof PrivateChannel || !msg.member) return
        const CANCEL_OPTIONS = language(`common:CANCEL_OPTIONS`)
        // If the user wants to cancel quit out and delete the collector
        if (CANCEL_OPTIONS.includes(msg.content.toLowerCase())) {
          Gamer.collectors.delete(msg.author.id)
          return
        }

        // The user must have provided some sort of content
        embed.addField(question, msg.content)
        // If more questions create another collector
        const guildSettings = (collector.data as FeedbackCollectorData).settings
        if (
          embed.code.fields.length !== (collector.data as FeedbackCollectorData).settings.feedback.idea.questions.length
        ) {
          const currentIndex = guildSettings.feedback.idea.questions.findIndex(q => question === q)
          // Something is very wrong quit out
          if (currentIndex < 0) return

          const nextQuestion = guildSettings.feedback.idea.questions[currentIndex + 1]
          // Send the message asking the user next question
          message.channel.createMessage(`${message.author.mention}, ${nextQuestion}`)
          // Update the collectors data
          collector.createdAt = Date.now()
          if (collector.data) (collector.data as FeedbackCollectorData).question = nextQuestion
          Gamer.collectors.set(message.author.id, collector)
        }

        // This was the final question so now we need to post the feedback
        Gamer.helpers.feedback.sendFeedback(message, channel, embed, settings, Gamer, language)
        return Gamer.helpers.levels.completeMission(msg.member, `baka`, msg.channel.guild.id)
      }
    })
  }

  Gamer.helpers.feedback.sendFeedback(message, channel, embed, settings, Gamer, language)
  return Gamer.helpers.levels.completeMission(message.member, `baka`, message.channel.guild.id)
})
