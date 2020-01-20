// Logs that a command run (even if it was inhibited)
import { PossiblyUncachedMessage, Message, PrivateChannel, GroupChannel } from 'eris'
import Event from '../lib/structures/Event'
import { ReactionEmoji } from '../lib/types/discord'
import constants from '../constants'
import Gamer from '..'

const eventEmojis: string[] = []
export default class extends Event {
  async execute(rawMessage: PossiblyUncachedMessage, emoji: ReactionEmoji, userID: string) {
    if (!eventEmojis.length) {
      const emojis = [constants.emojis.greenTick, constants.emojis.redX]

      for (const emoji of emojis) {
        const id = Gamer.helpers.discord.convertEmoji(emoji, `id`)
        if (id) eventEmojis.push(id)
      }
    }

    if (rawMessage.channel instanceof PrivateChannel || rawMessage.channel instanceof GroupChannel) return

    const user = Gamer.users.get(userID)
    if (!user) return

    if (user.bot) return

    // Need read message history perms to get the messages
    const botPerms = rawMessage.channel.permissionsOf(Gamer.user.id)
    if (!botPerms.has('readMessageHistory')) return

    // If it is an uncached message we need to fetch the message
    const message =
      rawMessage instanceof Message
        ? rawMessage
        : await Gamer.getMessage(rawMessage.channel.id, rawMessage.id).catch(() => undefined)
    // Incase another bot deletes the message we catch it
    if (!message) return

    if (eventEmojis.includes(emoji.id)) this.handleEventReaction(message, emoji, userID)
    this.handleReactionRole(message, emoji, userID)
    this.handleFeedbackReaction(message, emoji, userID)
  }

  async handleEventReaction(message: Message, emoji: ReactionEmoji, userID: string) {
    if (!message.author.bot || message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel)
      return
    const event = await Gamer.database.models.event.findOne({ adMessageID: message.id })
    if (!event) return

    const language = Gamer.getLanguage(message.guildID)

    const joinEmojiID = Gamer.helpers.discord.convertEmoji(constants.emojis.greenTick, `id`)

    if (emoji.id !== joinEmojiID) return
    if (!event.attendees.includes(userID) || !event.waitingList.includes(userID)) return

    // Leave the event if needed
    Gamer.helpers.events.leaveEvent(event, userID)
    const response = await message.channel.createMessage(language(`events/eventleave:LEFT`))
    setTimeout(() => response.delete(), 10000)
  }

  async handleReactionRole(message: Message, emoji: ReactionEmoji, userID: string) {
    if (!message.guildID || !message.member) return

    const member = message.member.guild.members.get(userID)
    if (!member) return

    const botMember = message.member.guild.members.get(Gamer.user.id)
    if (!botMember || !botMember.permission.has(`manageRoles`)) return

    const botsHighestRole = Gamer.helpers.discord.highestRole(botMember)

    const reactionRole = await Gamer.database.models.reactionRole.findOne({
      messageID: message.id
    })
    if (!reactionRole) return

    const emojiKey = `${emoji.name}:${emoji.id}`

    const relevantReaction = reactionRole.reactions.find(r => r.reaction === emojiKey)
    if (!relevantReaction || !relevantReaction.roleIDs.length) return

    for (const roleID of relevantReaction.roleIDs) {
      const role = message.member.guild.roles.get(roleID)
      if (!role || role.position > botsHighestRole.position) continue

      if (member.roles.includes(roleID)) member.removeRole(roleID, `Removed role for clicking reaction role.`)
      else member.addRole(roleID, `Added roles for clicking a reaction role message.`)
    }
  }

  async handleFeedbackReaction(message: Message, emoji: ReactionEmoji, userID: string) {
    if (!message.guildID || !message.member) return

    const fullEmojiName = `<:${emoji.name}:${emoji.id}>`

    if (!message.embeds.length || message.author.id !== Gamer.user.id) return

    // Check if this message is a feedback message
    const feedback = await Gamer.database.models.feedback.findOne({ id: message.id })
    if (!feedback) return
    // Fetch the guild settings for this guild
    const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })
    if (!guildSettings) return

    // Check if valid feedback channel
    if (![guildSettings.feedback.idea.channelID, guildSettings.feedback.bugs.channelID].includes(message.channel.id))
      return
    // Check if a valid emoji was used
    const feedbackReactions: string[] = []
    if (feedback.isBugReport)
      feedbackReactions.push(guildSettings.feedback.bugs.emojis.down, guildSettings.feedback.bugs.emojis.up)
    else feedbackReactions.push(guildSettings.feedback.idea.emojis.down, guildSettings.feedback.idea.emojis.up)

    if (!feedbackReactions.includes(fullEmojiName)) return

    const reactorMember = message.member.guild.members.get(userID)
    if (!reactorMember) return

    const feedbackMember = message.member.guild.members.get(feedback.authorID)

    // If the user is no longer in the server we dont need to grant any xp
    if (!feedbackMember) return

    const downEmojis = [guildSettings.feedback.idea.emojis.down, guildSettings.feedback.bugs.emojis.down]
    const upEmojis = [guildSettings.feedback.idea.emojis.up, guildSettings.feedback.bugs.emojis.up]

    if (upEmojis.includes(fullEmojiName)) return Gamer.helpers.levels.removeXP(feedbackMember, 3)
    if (downEmojis.includes(fullEmojiName)) return Gamer.helpers.levels.addLocalXP(feedbackMember, 3, true)
    return
  }
}
