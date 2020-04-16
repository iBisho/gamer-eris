import { PossiblyUncachedMessage, Message, PrivateChannel, User, TextChannel, GroupChannel } from 'eris'
import Event from '../lib/structures/Event'
import { ReactionEmoji } from '../lib/types/discord'
import constants from '../constants'
import Gamer from '..'
import { MessageEmbed } from 'helperis'
import nodefetch from 'node-fetch'
import { highestRole } from 'helperis'

const eventEmojis: string[] = []
const networkReactions = [constants.emojis.heart, constants.emojis.repeat, constants.emojis.plus]
const feedbackEmojis = [
  constants.emojis.voteup,
  constants.emojis.votedown,
  constants.emojis.mailbox,
  constants.emojis.greenTick,
  constants.emojis.redX
]

export default class extends Event {
  async execute(rawMessage: PossiblyUncachedMessage, emoji: ReactionEmoji, userID: string) {
    if (rawMessage.channel instanceof PrivateChannel || rawMessage.channel instanceof GroupChannel) return

    const user = await Gamer.helpers.discord.fetchUser(Gamer, userID)
    if (!user || user.bot) return

    // Need read message history perms to get the messages
    const botPerms = rawMessage.channel.permissionsOf(Gamer.user.id)
    if (!botPerms.has('readMessageHistory')) return

    // If it is an uncached message we need to fetch the message
    const message =
      rawMessage instanceof Message
        ? rawMessage
        : await rawMessage.channel.getMessage(rawMessage.id).catch(() => undefined)
    // Incase another bot deletes the message we catch it
    if (!message) return

    // Some odd bug removing channel on getMessage
    if (!(rawMessage instanceof Message)) message.channel = rawMessage.channel

    // Message might be from other users
    this.handleReactionRole(message, emoji, userID)

    // Messages must be from Gamer
    if (message.author.id !== Gamer.user.id) return

    this.handleProfileReaction(message, emoji, user)
    this.handleEventReaction(message, emoji, userID)
    this.handleNetworkReaction(message, emoji, user)
    this.handleFeedbackReaction(message, emoji, user)
  }

  async handleEventReaction(message: Message, emoji: ReactionEmoji, userID: string) {
    if (!eventEmojis.length) {
      const emojis = [constants.emojis.greenTick, constants.emojis.redX]

      for (const emoji of emojis) {
        const id = Gamer.helpers.discord.convertEmoji(emoji, `id`)
        if (id) eventEmojis.push(id)
      }
    }

    if (!message.author.bot || !message.member) return

    const event = await Gamer.database.models.event.findOne({ adMessageID: message.id })
    if (!event) return

    const language = Gamer.getLanguage(message.member.guild.id)

    const [joinEmojiID, denyEmojiID] = [constants.emojis.greenTick, constants.emojis.redX].map(e =>
      Gamer.helpers.discord.convertEmoji(e, `id`)
    )

    const denyReaction = Gamer.helpers.discord.convertEmoji(constants.emojis.redX, `reaction`)
    if (!denyReaction) return

    const joinReaction = Gamer.helpers.discord.convertEmoji(constants.emojis.greenTick, `reaction`)
    if (!joinReaction) return

    const member = await Gamer.helpers.discord.fetchMember(message.member.guild, userID)
    if (!member) return

    switch (emoji.id) {
      case joinEmojiID:
        const denyReactors = await message.getReaction(denyReaction).catch(() => [])
        if (denyReactors.find(user => user.id === userID)) message.removeReaction(denyReaction, userID)
        if (event.attendees.includes(userID)) return
        if (event.allowedRoleIDs.length && !event.allowedRoleIDs.some(id => member.roles.includes(id))) return

        const response = Gamer.helpers.events.joinEvent(event, userID, language)
        event.save()
        message.channel
          .createMessage(response)
          .then(msg => setTimeout(() => msg.delete().catch(() => undefined), 10000))
        break
      case denyEmojiID:
        const joinReactors = await message.getReaction(joinReaction).catch(() => [])
        if (joinReactors.find(user => user.id === userID)) message.removeReaction(joinReaction, userID)
        if (event.denials.includes(userID)) return

        Gamer.helpers.events.denyEvent(event, userID)
        message.channel
          .createMessage(language(`events/eventdeny:DENIED`))
          .then(msg => setTimeout(() => msg.delete().catch(() => undefined), 10000))
        break
    }
  }

  async handleReactionRole(message: Message, emoji: ReactionEmoji, userID: string) {
    console.log('reaction role1', message.id)
    if (!message.member) return

    console.log('reaction role2', message.id, message.member.guild.name, emoji, userID)

    const member = await Gamer.helpers.discord.fetchMember(message.member.guild, userID)
    if (!member) return
    console.log('reaction role3', message.id, message.member.guild.name, emoji, userID)

    const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
    if (!botMember || !botMember.permission.has(`manageRoles`)) return

    const botsHighestRole = highestRole(botMember)

    const reactionRole = await Gamer.database.models.reactionRole.findOne({ messageID: message.id })
    console.log('reaction role4', message.id, message.member.guild.name, emoji, userID, reactionRole)
    if (!reactionRole) return

    const emojiKey = `${emoji.name}:${emoji.id}`.toLowerCase()

    const relevantReaction = reactionRole.reactions.find(r => r.reaction.toLowerCase() === emojiKey)
    console.log('reaction role5', message.id, message.member.guild.name, emoji, userID, relevantReaction, reactionRole)
    if (!relevantReaction) return

    for (const roleID of relevantReaction.roleIDs) {
      const role = message.member.guild.roles.get(roleID)
      if (!role || role.position > botsHighestRole.position) continue

      if (member.roles.includes(roleID)) member.removeRole(roleID, `Removed role for clicking reaction role.`)
      else member.addRole(roleID, `Added roles for clicking a reaction role message.`)
    }
  }

  async handleProfileReaction(message: Message, emoji: ReactionEmoji, user: User) {
    if (!message.member) return

    const fullEmojiName = `<:${emoji.name}:${emoji.id}>`
    if (constants.emojis.discord !== fullEmojiName || !message.embeds.length) return

    const language = Gamer.getLanguage(message.member.guild.id)

    const [embed] = message.embeds
    if (embed.title !== language(`leveling/profile:CURRENT_MISSIONS`)) return
    Gamer.amplitude.push({
      authorID: message.author.id,
      channelID: message.channel.id,
      guildID: message.member.guild.id,
      messageID: message.id,
      timestamp: message.timestamp,
      type: 'PROFILE_INVITE'
    })

    try {
      const dmChannel = await user.getDMChannel()
      await dmChannel.createMessage(`Interested in Shop Titans? Check out https://discord.gg/shoptitans`)
    } catch {}
  }

  async handleNetworkReaction(message: Message, emoji: ReactionEmoji, user: User) {
    if (!message.member) return
    const fullEmojiName = `<:${emoji.name}:${emoji.id}>`

    if (!networkReactions.includes(fullEmojiName) || !message.embeds.length) return

    const [postEmbed] = message.embeds
    // Get the author id for the original author
    const originalAuthorID = postEmbed?.footer?.text
    if (!originalAuthorID) return

    const originalAuthor = await Gamer.helpers.discord.fetchUser(Gamer, originalAuthorID)
    if (!originalAuthor) return

    try {
      // Get the original authors user settings to find their profile server id
      const targetUserSettings = await Gamer.database.models.user.findOne({
        userID: originalAuthor.id
      })
      if (!targetUserSettings) return

      // If that server id isnt valid cancel
      const originalServer = targetUserSettings.network.guildID
        ? Gamer.guilds.get(targetUserSettings.network.guildID)
        : undefined
      if (!originalServer) return

      const language = Gamer.getLanguage(originalServer.id)

      // Get the guild settings for that server id
      const guildSettings = await Gamer.database.models.guild.findOne({
        id: originalServer.id
      })
      if (!guildSettings || !guildSettings.network.channelIDs.notifications) return

      // Find the notifications channel from that server
      const notificationChannel = Gamer.getChannel(guildSettings.network.channelIDs.notifications)
      if (!notificationChannel || !(notificationChannel instanceof TextChannel)) return

      const reactorTag = `${user.username}#${user.discriminator}`

      switch (fullEmojiName) {
        case constants.emojis.heart: {
          // Send a notification to the original authors notification channel saying x user liked it
          await notificationChannel.createMessage(
            language(`network/reaction:LIKED`, { user: reactorTag, guildName: message.member.guild.name })
          )
          // Post the original embed so the user knows which post was liked
          await notificationChannel.createMessage({ embed: postEmbed })

          // Send a response like post delete it
          const liked = await message.channel.createMessage(language(`network/reaction:THANKS_LIKED`))
          return setTimeout(() => liked.delete().catch(() => undefined), 10000)
        }
        case constants.emojis.repeat: {
          const userSettings = await Gamer.database.models.user.findOne({
            userID: user.id
          })
          if (!userSettings) return

          const usersGuild = userSettings.network.guildID ? Gamer.guilds.get(userSettings.network.guildID) : undefined
          if (!usersGuild) return

          const usersGuildSettings = await Gamer.database.models.guild.findOne({
            id: userSettings.network.guildID
          })
          if (!usersGuildSettings || !usersGuildSettings.network.channelIDs.wall) return

          const wallChannel = Gamer.getChannel(usersGuildSettings.network.channelIDs.wall)

          // If the reacting user doesnt have a wall channel tell cancel out
          if (!wallChannel || !(wallChannel instanceof TextChannel)) {
            const errorResponse = await message.channel.createMessage(
              language(`network/reaction:NEED_PROFILE_TO_RETWEET`)
            )
            return setTimeout(() => errorResponse.delete().catch(() => undefined), 10000)
          }

          // Double check if bot has perms in this users wall channel
          if (
            !Gamer.helpers.discord.checkPermissions(wallChannel, Gamer.user.id, [
              'readMessages',
              'sendMessages',
              'embedLinks',
              'addReactions',
              'readMessageHistory',
              'externalEmojis'
            ])
          ) {
            const errorResponse = await message.channel.createMessage(language(`network/reaction:MISSING_PERMS_WALL`))
            return setTimeout(() => errorResponse.delete().catch(() => undefined), 10000)
          }

          // Repost this message on the user, that reacted, wall channel
          const reposted = await wallChannel.createMessage({ embed: postEmbed })
          for (const reaction of networkReactions) {
            const validReaction = Gamer.helpers.discord.convertEmoji(reaction, `reaction`)
            if (validReaction) reposted.addReaction(validReaction)
          }

          // Send a notification to the original authors notification channel saying x user reposted it
          await notificationChannel.createMessage(
            language(`network/reaction:REPOSTED`, {
              username: reactorTag,
              guildName: message.member.guild.name,
              newGuildName: usersGuild.name
            })
          )
          // Post the original embed so the user knows which post was reposted
          await notificationChannel.createMessage({ embed: postEmbed })

          // Send a response like post delete it
          const success = await message.channel.createMessage(
            language(`network/reaction:THANKS_REPOSTED`, { channel: wallChannel.mention })
          )
          return setTimeout(() => success.delete().catch(() => undefined), 10000)
        }
        case constants.emojis.plus: {
          // Follow the original author profile server
          const userSettings = await Gamer.database.models.user.findOne({
            userID: user.id
          })
          if (!userSettings) return

          const usersGuild = userSettings.network.guildID ? Gamer.guilds.get(userSettings.network.guildID) : undefined
          if (!usersGuild) return

          const usersGuildSettings = await Gamer.database.models.guild.findOne({
            id: userSettings.network.guildID
          })
          if (!usersGuildSettings || !usersGuildSettings.network.channelIDs.feed) return

          // Check if the user is already following the original poster
          const isAlreadyFollowing = guildSettings.network.channelIDs.followers.includes(
            usersGuildSettings.network.channelIDs.feed
          )

          // Remove the users feed channel from the targets followers
          if (isAlreadyFollowing)
            guildSettings.network.channelIDs.followers = guildSettings.network.channelIDs.followers.filter(
              id => id !== usersGuildSettings.network.channelIDs.feed
            )
          // Add the users feed channel to the targets followers
          else guildSettings.network.channelIDs.followers.push(usersGuildSettings.network.channelIDs.feed)

          guildSettings.save()

          const response = await message.channel.createMessage(
            language(isAlreadyFollowing ? `network/networkfollow:UNFOLLOWED` : `network/networkfollow:FOLLOWED`, {
              username: user.username
            })
          )
          setTimeout(() => response.delete().catch(() => undefined), 10000)

          return notificationChannel.createMessage(
            language(
              isAlreadyFollowing ? `network/networkfollow:LOSE_FOLLOWER` : `network/networkfollow:ADD_FOLLOWER`,
              { username: `${user.username}#${user.discriminator}`, id: user.id }
            )
          )
        }
        default:
          return
      }
    } catch (error) {
      Gamer.emit('error', error)
      const language = Gamer.getLanguage(message.member.guild.id)

      const response = await message.channel.createMessage(language(`network/reaction:FAILED`))
      return setTimeout(() => response.delete().catch(() => undefined), 10000)
    }
  }

  async handleFeedbackReaction(message: Message, emoji: ReactionEmoji, user: User) {
    if (!message.member) return

    const fullEmojiName = `<:${emoji.name}:${emoji.id}>`

    if (!message.embeds.length || message.author.id !== Gamer.user.id) return

    // Check if this message is a feedback message
    const feedback = await Gamer.database.models.feedback.findOne({ id: message.id })
    if (!feedback) return

    // Fetch the guild settings for this guild
    const guildSettings = await Gamer.database.models.guild.findOne({ id: message.member.guild.id })
    if (!guildSettings) return

    // Check if valid feedback channel
    if (
      ![
        guildSettings.feedback.idea.channelID,
        guildSettings.feedback.bugs.channelID,
        guildSettings.feedback.approvalChannelID
      ].includes(message.channel.id)
    )
      return

    // Check if a valid emoji was used
    if (!feedbackEmojis.includes(fullEmojiName)) return

    const reactorMember = await Gamer.helpers.discord.fetchMember(message.member.guild, user.id)
    if (!reactorMember) return

    const reactorIsMod = reactorMember.roles.some(id => guildSettings.staff.modRoleIDs.includes(id))
    const reactorIsAdmin =
      reactorMember.permission.has('administrator') ||
      (guildSettings.staff.adminRoleID && reactorMember.roles.includes(guildSettings.staff.adminRoleID))

    const feedbackMember = await Gamer.helpers.discord.fetchMember(message.member.guild, feedback.authorID)

    const language = Gamer.getLanguage(message.member.guild.id)

    switch (fullEmojiName) {
      // This case will run if the reaction was the Mailbox reaction
      case constants.emojis.mailbox:
        // If the user is not atleast a mod cancel everything
        if (!reactorIsAdmin && !reactorIsMod) return
        // Server has not enabled mails
        if (!guildSettings.mails.enabled || !guildSettings.mails.categoryID) return

        const openMail = await Gamer.database.models.mail.findOne({
          guildID: message.member.guild.id,
          userID: feedback.authorID
        })
        // The feedback author does not have any open mails
        if (!openMail) {
          // Make sure the member is in the guild
          if (!feedbackMember) return
          // Create a mail for this guild. Passing the 4th arg User will override message.author in createMail
          return Gamer.helpers.mail.createMail(
            message,
            `Feedback details requested by ${reactorMember.username}`,
            guildSettings,
            feedbackMember.user
          )
        }
        // They have an open mail so we can just send it there
        const mailChannel = message.member.guild.channels.get(openMail.id)
        if (!mailChannel || !(mailChannel instanceof TextChannel)) return
        return mailChannel.createMessage({ content: user.mention, embed: message.embeds[0] })
      // This case will run if the reaction was the solved green check mark
      case constants.emojis.greenTick:
        // If the user is not atleast a mod cancel everything
        if (!reactorIsAdmin && !reactorIsMod) return

        // If this is the approval channel we need to move the feedback to the new channel
        if (message.channel.id === guildSettings.feedback.approvalChannelID) {
          const [embed] = message.embeds
          const channelID = feedback.isBugReport
            ? guildSettings.feedback.bugs.channelID
            : guildSettings.feedback.idea.channelID
          if (!channelID) return

          const channel = message.member.guild.channels.get(channelID)
          if (!channel || !(channel instanceof TextChannel)) return

          const hasApprovedPerms = Gamer.helpers.discord.checkPermissions(channel, Gamer.user.id, [
            'readMessages',
            'sendMessages',
            'embedLinks',
            'addReactions',
            'externalEmojis',
            'readMessageHistory'
          ])
          if (!hasApprovedPerms) return

          const img = embed.image?.url
            ? await nodefetch(embed.image?.url)
                .then(res => res.buffer())
                .catch(() => undefined)
            : undefined
          if (img) embed.image = { url: `attachment://approved.png` }

          const approvedFeedback = await channel.createMessage(
            { embed },
            img ? { name: `approved.png`, file: img } : undefined
          )
          if (!approvedFeedback) return

          const reactions = feedbackEmojis.map((emoji: string) => Gamer.helpers.discord.convertEmoji(emoji, `reaction`))
          for (const reaction of reactions) if (reaction) await approvedFeedback.addReaction(reaction)

          feedback.id = approvedFeedback.id
          feedback.save()
          return message.delete().catch(() => undefined)
        }

        // Send a DM to the user telling them it was solved
        const embed = new MessageEmbed()
          .setDescription(guildSettings.feedback.solvedMessage || language(`feedback/idea:SOLVED_DEFAULT`))
          .setAuthor(`Feedback From ${message.member.guild.name}`, message.member.guild.iconURL)
          .setTimestamp()

        if (feedbackMember) {
          Gamer.helpers.levels.addLocalXP(feedbackMember, 50, true)
          try {
            const dmChannel = await feedbackMember.user.getDMChannel()
            await dmChannel.createMessage({ embed: embed.code })
            // Shows the user the feedback that was accepted
            await dmChannel.createMessage({ embed: message.embeds[0] })
          } catch {}
        }

        // Send the feedback to the solved channel
        const channel = guildSettings.feedback.solvedChannelID
          ? message.member.guild.channels.get(guildSettings.feedback.solvedChannelID)
          : undefined
        // If the bot has all necessary permissions in the log channel
        if (channel && channel instanceof TextChannel) {
          const botPerms = channel.permissionsOf(Gamer.user.id)
          if (botPerms.has('readMessages') && botPerms.has('sendMessages') && botPerms.has('embedLinks'))
            channel.createMessage({ embed: message.embeds[0] })
        }

        // Deletes the feedback
        return message.delete().catch(() => undefined)
      // This case will run when the red x is reacted on
      case constants.emojis.redX:
        // If the user is not atleast a mod cancel everything
        if (!reactorIsAdmin && !reactorIsMod) return

        // Send a DM to the user telling them it was solved
        const rejectedEmbed = new MessageEmbed()
          .setDescription(guildSettings.feedback.rejectedMessage || language(`feedback/idea:REJECTED_DEFAULT`))
          .setAuthor(`Feedback From ${message.member.guild.name}`, message.member.guild.iconURL)
          .setTimestamp()

        if (feedbackMember) {
          Gamer.helpers.levels.addLocalXP(feedbackMember, 50, true)
          try {
            const dmChannel = await feedbackMember.user.getDMChannel()
            await dmChannel.createMessage({ embed: rejectedEmbed.code })
            // Shows the user the feedback that was accepted
            await dmChannel.createMessage({ embed: message.embeds[0] })
          } catch {}
        }

        // Send the feedback to the solved channel
        const rejectedChannel = guildSettings.feedback.rejectedChannelID
          ? message.member.guild.channels.get(guildSettings.feedback.rejectedChannelID)
          : undefined
        // If the bot has all necessary permissions in the log channel
        if (rejectedChannel && rejectedChannel instanceof TextChannel) {
          const botPerms = rejectedChannel.permissionsOf(Gamer.user.id)
          if (botPerms.has('readMessages') && botPerms.has('sendMessages') && botPerms.has('embedLinks'))
            rejectedChannel.createMessage({ embed: message.embeds[0] })
        }

        // Deletes the feedback
        return message.delete().catch(() => undefined)
      // This case will run for when users react with anything else to it
      default:
        // If the user is no longer in the server we dont need to grant any xp
        if (!feedbackMember) return

        if (fullEmojiName === constants.emojis.votedown) {
          Gamer.helpers.levels.completeMission(reactorMember, `votefeedback`, reactorMember.guild.id)
          return Gamer.helpers.levels.removeXP(feedbackMember, 3)
        } else if (fullEmojiName === constants.emojis.voteup) {
          Gamer.helpers.levels.completeMission(reactorMember, `votefeedback`, reactorMember.guild.id)
          return Gamer.helpers.levels.addLocalXP(feedbackMember, 3, true)
        }
    }
  }
}
