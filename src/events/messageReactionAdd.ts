import { PossiblyUncachedMessage, Message, PrivateChannel, User, TextChannel } from 'eris'
import Event from '../lib/structures/Event'
import { ReactionEmoji } from '../lib/types/discord'
import constants from '../constants'
import Gamer from '..'
import { GamerEvent, GamerReactionRole } from '../lib/types/gamer'

const eventEmojis: string[] = []
const networkReactions = [constants.emojis.heart, constants.emojis.repeat, constants.emojis.plus]

export default class extends Event {
  async execute(rawMessage: PossiblyUncachedMessage, emoji: ReactionEmoji, userID: string) {
    if (!eventEmojis.length) {
      const emojis = [constants.emojis.greenTick, constants.emojis.redX]

      for (const emoji of emojis) {
        const id = Gamer.helpers.discord.convertEmoji(emoji, `id`)
        if (id) eventEmojis.push(id)
      }
    }

    const user = Gamer.users.get(userID)
    if (!user || user.bot) return

    // If it is an uncached message we need to fetch the message
    const message =
      rawMessage instanceof Message ? rawMessage : await Gamer.getMessage(rawMessage.channel.id, rawMessage.id)

    if (eventEmojis.includes(emoji.id)) this.handleEventReaction(message, emoji, userID)
    this.handleReactionRole(message, emoji, userID)
    this.handleProfileReaction(message, emoji, user)
    this.handleNetworkReaction(message, emoji, user)
  }

  async handleEventReaction(message: Message, emoji: ReactionEmoji, userID: string) {
    if (!message.author.bot || message.channel instanceof PrivateChannel) return
    const event = (await Gamer.database.models.event.findOne({ adMessageID: message.id })) as GamerEvent | null
    if (!event) return

    const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
    if (!language) return

    const [joinEmojiID, denyEmojiID] = [constants.emojis.greenTick, constants.emojis.redX].map(e =>
      Gamer.helpers.discord.convertEmoji(e, `id`)
    )

    switch (emoji.id) {
      case joinEmojiID:
        const joinReaction = Gamer.helpers.discord.convertEmoji(constants.emojis.greenTick, `reaction`)
        if (!joinReaction) return
        const joinReactors = await message.getReaction(joinReaction).catch(() => [])
        if (joinReactors.find(user => user.id === userID)) message.removeReaction(joinReaction)

        const response = Gamer.helpers.events.joinEvent(event, userID, language)
        message.channel.createMessage(response).then(msg => setTimeout(() => msg.delete(), 10000))
        break
      case denyEmojiID:
        const denyReaction = Gamer.helpers.discord.convertEmoji(constants.emojis.redX, `reaction`)
        if (!denyReaction) return
        const denyReactors = await message.getReaction(denyReaction).catch(() => [])
        if (denyReactors.find(user => user.id === userID)) message.removeReaction(denyReaction)

        Gamer.helpers.events.denyEvent(event, userID)
        message.channel
          .createMessage(language(`events/eventdeny:DENIED`))
          .then(msg => setTimeout(() => msg.delete(), 10000))
        break
    }
  }

  async handleReactionRole(message: Message, emoji: ReactionEmoji, userID: string) {
    if (message.channel instanceof PrivateChannel) return

    const guild = Gamer.guilds.get(message.channel.guild.id)
    if (!guild) return

    const member = guild.members.get(userID)
    if (!member) return

    const botMember = guild.members.get(Gamer.user.id)
    if (!botMember || !botMember.permission.has(`manageRoles`)) return

    const botsHighestRole = Gamer.helpers.discord.highestRole(botMember)

    const reactionRole = (await Gamer.database.models.reactionRole.findOne({
      messageID: message.id
    })) as GamerReactionRole | null
    if (!reactionRole) return

    const emojiKey = `${emoji.name}:${emoji.id}`

    const relevantReaction = reactionRole.reactions.find(r => r.reaction === emojiKey)
    if (!relevantReaction || !relevantReaction.roleIDs.length) return

    for (const roleID of relevantReaction.roleIDs) {
      const role = guild.roles.get(roleID)
      if (!role || role.position > botsHighestRole.position) continue

      if (member.roles.includes(roleID)) member.removeRole(roleID, `Removed role for clicking reaction role.`)
      else member.addRole(roleID, `Added roles for clicking a reaction role message.`)
    }
  }

  async handleProfileReaction(message: Message, emoji: ReactionEmoji, user: User) {
    if (message.channel instanceof PrivateChannel || user.id !== Gamer.user.id) return

    const fullEmojiName = `<:${emoji.name}:${emoji.id}>`
    if (constants.emojis.discord !== fullEmojiName || !message.embeds.length || !message.attachments.length) return

    Gamer.amplitude.push({
      authorID: message.author.id,
      channelID: message.channel.id,
      guildID: message.channel.guild.id,
      messageID: message.id,
      timestamp: message.timestamp,
      type: 'PROFILE_INVITE'
    })

    Gamer.helpers.logger.green(`${user.username} just reacted to a profile discord invite <3`)
    try {
      const dmChannel = await user.getDMChannel()
      dmChannel.createMessage(`Interested in Shop Titans? Check out https://discord.gg/shoptitans`)
    } catch {}
  }

  async handleNetworkReaction(message: Message, emoji: ReactionEmoji, user: User) {
    if (message.channel instanceof PrivateChannel || user.bot) return
    const fullEmojiName = `<:${emoji.name}:${emoji.id}>`

    if (!networkReactions.includes(fullEmojiName) || !message.embeds.length) return

    const [postEmbed] = message.embeds
    // Get the author id for the original author
    const originalAuthorID = postEmbed?.footer?.text
    if (!originalAuthorID) return

    const originalAuthor = Gamer.users.get(originalAuthorID)
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
        : null
      if (!originalServer) return

      const language = Gamer.i18n.get(Gamer.guildLanguages.get(originalServer.id) || `en-US`)
      if (!language) return

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
            language(`network/reaction:LIKED`, { user: reactorTag, guildName: message.channel.guild.name })
          )
          // Post the original embed so the user knows which post was liked
          await notificationChannel.createMessage({ embed: postEmbed })

          // Send a response like post delete it
          const liked = await message.channel.createMessage(language(`network/reaction:THANKS_LIKED`))
          return setTimeout(() => liked.delete(), 10000)
        }
        case constants.emojis.repeat: {
          const userSettings = await Gamer.database.models.user.findOne({
            userID: user.id
          })
          if (!userSettings) return

          const usersGuild = userSettings.network.guildID ? Gamer.guilds.get(userSettings.network.guildID) : null
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
            return setTimeout(() => errorResponse.delete(), 10000)
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
            return setTimeout(() => errorResponse.delete(), 10000)
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
              guildName: message.channel.guild.name,
              newGuildName: usersGuild.name
            })
          )
          // Post the original embed so the user knows which post was reposted
          await notificationChannel.createMessage({ embed: postEmbed })

          // Send a response like post delete it
          const success = await message.channel.createMessage(
            language(`network/reaction:THANKS_REPOSTED`, { channel: wallChannel.mention })
          )
          return setTimeout(() => success.delete(), 10000)
        }
        case constants.emojis.plus: {
          // Follow the original author profile server
          const userSettings = await Gamer.database.models.user.findOne({
            userID: user.id
          })
          if (!userSettings) return

          const usersGuild = userSettings.network.guildID ? Gamer.guilds.get(userSettings.network.guildID) : null
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
          return setTimeout(() => response.delete(), 10000)
        }
        default:
          return null
      }
    } catch (error) {
      Gamer.emit('error', error)
      const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
      if (!language) return

      const response = await message.channel.createMessage(language(`network/reaction:FAILED`))
      return setTimeout(() => response.delete(), 10000)
    }
  }
}
