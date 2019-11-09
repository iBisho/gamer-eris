import { Message, TextChannel } from 'eris'
import constants from '../../constants'
import GamerEmbed from '../structures/GamerEmbed'
import { GuildSettings } from '../types/settings'
import GamerClient from '../structures/GamerClient'
import { TFunction } from 'i18next'

export default class {
  async sendFeedback(
    message: Message,
    channel: TextChannel,
    embed: GamerEmbed,
    settings: GuildSettings,
    Gamer: GamerClient,
    language: TFunction
  ) {
    // All questions are answered so send the feedback
    const feedback = await channel.createMessage({ embed: embed.code })
    if (!feedback) return

    // Create all reactions and the react to the message sent in the feedback channel
    const reactions = [
      settings.feedback.bugs.emojis.up,
      settings.feedback.bugs.emojis.down,
      constants.emojis.questionMark,
      constants.emojis.mailbox,
      constants.emojis.greenTick,
      constants.emojis.redX
    ].map((emoji: string) => Gamer.helpers.discord.convertEmoji(emoji, `reaction`))
    for (const emoji of reactions) if (emoji) await feedback.addReaction(emoji)

    // Increment by 1
    settings.feedback.feedbacksSent = settings.feedback.feedbacksSent + 1
    settings.save()

    // Add the feedback to the database for use in the reaction system
    const payload = new Gamer.database.models.feedback({
      id: feedback.id,
      authorID: message.author.id,
      guildID: channel.guild.id,
      channelID: message.channel.id,
      number: settings.feedback.feedbacksSent,
      type: `bugs`
    })
    payload.save()

    // Check if this server has a log channel id
    const logChannel = settings.feedback.logChannelID
      ? channel.guild.channels.get(settings.feedback.logChannelID)
      : undefined
    if (logChannel && logChannel instanceof TextChannel) {
      // If gamer has the necessary permissions to send, then send the embed in the log channel
      if (
        Gamer.helpers.discord.checkPermissions(logChannel, Gamer.user.id, [
          `readMessages`,
          `sendMessages`,
          `embedLinks`
        ])
      )
        logChannel.createMessage({ embed: embed.code })
    }

    // Respond to user that the feedback was sent
    return message.channel.createMessage(language(`feedback/bugs:SENT`, { mention: message.author.mention }))
  }
}
