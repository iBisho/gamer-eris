// Logs that a command run (even if it was inhibited)
import { Message, Guild, TextChannel, NewsChannel, Emoji } from 'eris'
import constants from '../constants'
import Gamer from '..'
import { highestRole } from 'helperis'
import { EventListener } from 'yuuko'
import { addRoleToMember, removeRoleFromMember, sendMessage, deleteMessage } from '../lib/utils/eris'

const eventEmojis: string[] = []

async function handleGiveaway(message: Message, emoji: Emoji, userID: string, guild: Guild) {
  const reactor = await Gamer.helpers.discord.fetchMember(guild, userID)
  if (!reactor) return

  const giveaway = await Gamer.database.models.giveaway.findOne({ guildID: guild.id, messageID: message.id })
  if (!giveaway) return

  const fullEmoji = `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`
  const emojiID = Gamer.helpers.discord.convertEmoji(giveaway.emoji, 'id')
  if (fullEmoji !== giveaway.emoji && emoji.id !== emojiID) return

  // This giveaway has not yet started
  if (!giveaway.hasStarted || giveaway.hasEnded) return

  Gamer.database.models.giveaway
    .findOneAndUpdate(
      { _id: giveaway._id },
      { participants: giveaway.participants.filter(participant => participant.userID !== userID) }
    )
    .exec()

  const alert = await sendMessage(
    giveaway.notificationsChannelID,
    `<@${userID}>, you have been **REMOVED** from the giveaway.`
  )
  if (alert && giveaway.simple) deleteMessage(alert, 10)
}

async function handleEventReaction(message: Message, emoji: Emoji, userID: string) {
  if (!message.author.bot || !message.member) return
  const event = await Gamer.database.models.event.findOne({ adMessageID: message.id })
  if (!event) return

  const language = Gamer.getLanguage(message.member.guild.id)

  const joinEmojiID = Gamer.helpers.discord.convertEmoji(constants.emojis.greenTick, `id`)

  if (emoji.id !== joinEmojiID) return
  if (!event.attendees.includes(userID) || !event.waitingList.includes(userID)) return

  // Leave the event if needed
  Gamer.helpers.events.leaveEvent(event, userID)
  const response = await message.channel.createMessage(language(`events/eventleave:LEFT`))
  setTimeout(() => response.delete(), 10000)
}

async function handleReactionRole(message: Message, emoji: Emoji, userID: string, guild: Guild) {
  const member = await Gamer.helpers.discord.fetchMember(guild, userID)
  if (!member) return

  const botMember = await Gamer.helpers.discord.fetchMember(guild, Gamer.user.id)
  if (!botMember || !botMember.permission.has(`manageRoles`)) return

  const botsHighestRole = highestRole(botMember)

  const reactionRole = await Gamer.database.models.reactionRole.findOne({ messageID: message.id })
  if (!reactionRole) return

  const emojiKey = `${emoji.name}:${emoji.id}`

  const relevantReaction = reactionRole.reactions.find(r => r.reaction === emojiKey)
  if (!relevantReaction || !relevantReaction.roleIDs.length) return

  for (const roleID of relevantReaction.roleIDs) {
    const role = guild.roles.get(roleID)
    if (!role || role.position > botsHighestRole.position) continue

    if (member.roles.includes(roleID)) removeRoleFromMember(member, roleID, `Removed role for clicking reaction role.`)
    else addRoleToMember(member, roleID, `Added roles for clicking a reaction role message.`)
  }
}

async function handleFeedbackReaction(message: Message, emoji: Emoji, userID: string) {
  if (!message.member) return

  const fullEmojiName = `<:${emoji.name}:${emoji.id}>`

  if (!message.embeds.length || message.author.id !== Gamer.user.id) return

  // Check if this message is a feedback message
  const feedback = await Gamer.database.models.feedback.findOne({ feedbackID: message.id })
  if (!feedback) return
  // Fetch the guild settings for this guild
  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.member.guild.id })
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

  const reactorMember = await Gamer.helpers.discord.fetchMember(message.member.guild, userID)
  if (!reactorMember) return

  const feedbackMember = await Gamer.helpers.discord.fetchMember(message.member.guild, feedback.authorID)
  // If the user is no longer in the server we dont need to grant any xp
  if (!feedbackMember) return

  const downEmojis = [guildSettings.feedback.idea.emojis.down, guildSettings.feedback.bugs.emojis.down]
  const upEmojis = [guildSettings.feedback.idea.emojis.up, guildSettings.feedback.bugs.emojis.up]

  if (upEmojis.includes(fullEmojiName)) return Gamer.helpers.levels.removeXP(feedbackMember, 3)
  if (downEmojis.includes(fullEmojiName)) return Gamer.helpers.levels.addLocalXP(feedbackMember, 3, true)
  return
}

async function handleAutoRole(message: Message, guild: Guild, userID: string) {
  // Autorole must be the first role granted to be 100% confirmed that the user is in fact verified.
  if (!message.member || message.member.roles.length > 1) return
  if (Gamer.debugModeEnabled)
    Gamer.helpers.logger.debug(
      `AUTOROLE ON REACTION REM: MessageID: ${message.id} UserID: ${userID} Guild Name: ${guild.name} ID: ${guild.id}`
    )

  const language = Gamer.getLanguage(message.guildID)
  const bot = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!bot || !bot.permission.has('manageRoles')) return

  const role = highestRole(bot)
  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: guild.id })
  if (!guildSettings?.moderation.roleIDs.autorole) return

  const autorole = message.member.guild.roles.get(guildSettings.moderation.roleIDs.autorole)
  if (!autorole || autorole.position >= role.position) return

  Gamer.amplitude.push({
    authorID: message.author.id,
    channelID: message.channel.id,
    guildID: guild.id,
    messageID: message.id,
    timestamp: message.timestamp,
    memberID: message.member.id,
    type: 'ROLE_REMOVED'
  })

  const member = await Gamer.helpers.discord.fetchMember(message.member.guild, userID)
  if (!member) return

  return addRoleToMember(member, guildSettings.moderation.roleIDs.autorole, language(`basic/verify:AUTOROLE_ASSIGNED`))
}

export default new EventListener('messageReactionRemove', async (rawMessage, emoji, userID) => {
  if (!eventEmojis.length) {
    const emojis = [constants.emojis.greenTick, constants.emojis.redX]

    for (const emoji of emojis) {
      const id = Gamer.helpers.discord.convertEmoji(emoji, `id`)
      if (id) eventEmojis.push(id)
    }
  }

  if (!(rawMessage.channel instanceof TextChannel) && !(rawMessage.channel instanceof NewsChannel)) return

  const guild = rawMessage.channel.guild
  if (!guild) return

  const user = await Gamer.helpers.discord.fetchUser(userID)
  if (!user || user.bot) return

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

  if (eventEmojis.includes(emoji.id)) handleEventReaction(message, emoji, userID)
  handleReactionRole(message, emoji, userID, guild)
  handleFeedbackReaction(message, emoji, userID)
  handleAutoRole(message, guild, userID)
  handleGiveaway(message, emoji, userID, guild)
})
