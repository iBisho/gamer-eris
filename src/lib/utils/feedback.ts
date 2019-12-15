import { Message, TextChannel } from 'eris'
import constants from '../../constants'
import GamerEmbed from '../structures/GamerEmbed'
import { GuildSettings } from '../types/settings'
import GamerClient from '../structures/GamerClient'

export default class {
  Gamer: GamerClient

  constructor(client: GamerClient) {
    this.Gamer = client
  }

  async sendBugReport(message: Message, channel: TextChannel, embed: GamerEmbed, settings: GuildSettings) {
    const language = this.Gamer.i18n.get(this.Gamer.guildLanguages.get(channel.guild.id) || `en-US`)
    if (!language) return

    const feedback = await channel.createMessage({ embed: embed.code })
    if (!feedback) return

    // Create all reactions and then react to the message sent in the feedback channel
    // Permissions are checked in the bug command so we should be good to react
    const reactions = [
      settings.feedback.bugs.emojis.up,
      settings.feedback.bugs.emojis.down,
      constants.emojis.questionMark,
      constants.emojis.mailbox,
      constants.emojis.greenTick,
      constants.emojis.redX
    ].map((emoji: string) => this.Gamer.helpers.discord.convertEmoji(emoji, `reaction`))
    for (const emoji of reactions) if (emoji) await feedback.addReaction(emoji)

    // Increment by 1
    settings.feedback.feedbacksSent = settings.feedback.feedbacksSent ? settings.feedback.feedbacksSent + 1 : 1
    settings.save()

    // Add the feedback to the database for use in the reaction system
    const payload = await this.Gamer.database.models.feedback.create({
      id: feedback.id,
      authorID: message.author.id,
      guildID: channel.guild.id,
      channelID: message.channel.id,
      number: settings.feedback.feedbacksSent,
      isBugReport: true
    })
    payload.save()

    if (settings.feedback.logChannelID) this.logFeedback(embed, settings.feedback.logChannelID)

    // Respond to user that the feedback was sent
    return message.channel.createMessage(language(`feedback/bugs:SENT`, { mention: message.author.mention }))
  }

  async sendIdea(message: Message, channel: TextChannel, embed: GamerEmbed, settings: GuildSettings) {
    const language = this.Gamer.i18n.get(this.Gamer.guildLanguages.get(channel.guild.id) || `en-US`)
    if (!language) return

    const feedback = await channel.createMessage({ embed: embed.code })
    if (!feedback) return

    // Create all reactions and then react to the message sent in the feedback channel
    // Permissions are checked in the idea command so we should be good to react
    const reactions = [
      settings.feedback.idea.emojis.up,
      settings.feedback.idea.emojis.down,
      constants.emojis.questionMark,
      constants.emojis.mailbox,
      constants.emojis.greenTick,
      constants.emojis.redX
    ].map((emoji: string) => this.Gamer.helpers.discord.convertEmoji(emoji, `reaction`))
    for (const emoji of reactions) if (emoji) await feedback.addReaction(emoji)

    // Increment by 1
    settings.feedback.feedbacksSent = settings.feedback.feedbacksSent ? settings.feedback.feedbacksSent + 1 : 1
    settings.save()

    // Add the feedback to the database for use in the reaction system
    const payload = await this.Gamer.database.models.feedback.create({
      id: feedback.id,
      authorID: message.author.id,
      guildID: channel.guild.id,
      channelID: message.channel.id,
      number: settings.feedback.feedbacksSent,
      isBugReport: false
    })
    payload.save()

    if (settings.feedback.logChannelID) this.logFeedback(embed, settings.feedback.logChannelID)

    // Respond to user that the feedback was sent
    return message.channel.createMessage(language(`feedback/idea:SENT`, { mention: message.author.mention }))
  }

  async logFeedback(embed: GamerEmbed, channelID: string) {
    // Check if this log channel is valid
    const logChannel = this.Gamer.getChannel(channelID)
    if (!logChannel || !(logChannel instanceof TextChannel)) return

    // If gamer has the necessary permissions to send, then send the embed in the log channel
    if (
      !this.Gamer.helpers.discord.checkPermissions(logChannel, this.Gamer.user.id, [
        `readMessages`,
        `sendMessages`,
        `embedLinks`
      ])
    )
      return
    return logChannel.createMessage({ embed: embed.code })
  }
}
