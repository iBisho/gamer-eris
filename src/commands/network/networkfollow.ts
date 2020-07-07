import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { TextChannel } from 'eris'

export default new Command([`networkfollow`, `follow`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const [userID] = args
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const user = message.mentions.length ? message.mentions[0] : await Gamer.helpers.discord.fetchUser(Gamer, userID)
  if (!user) return helpCommand.execute(message, [`networkfollow`], { ...context, commandName: 'help' })

  // The command users settings
  const userSettings = await Gamer.database.models.user.findOne({ userID: message.author.id })

  if (!userSettings || !userSettings.networkGuildID)
    return message.channel.createMessage(language(`network/networkfollow:NEED_PROFILE_SERVER`))

  const usersProfileGuildSettings = await Gamer.database.models.guild.findOne({ guildID: userSettings.networkGuildID })

  if (!usersProfileGuildSettings)
    return message.channel.createMessage(language(`network/networkfollow:NEED_PROFILE_SERVER`))

  // The target users settings
  const targetUserSettings = await Gamer.database.models.user.findOne({
    userID: message.author.id
  })
  if (!targetUserSettings || !targetUserSettings.networkGuildID)
    return message.channel.createMessage(language(`network/networkfollow:NEED_TARGET_PROFILE_SERVER`))

  const targetUsersProfileGuildSettings = await Gamer.database.models.guild.findOne({
    guildID: targetUserSettings.networkGuildID
  })

  if (!targetUsersProfileGuildSettings || !usersProfileGuildSettings.network.channelIDs.feed)
    return message.channel.createMessage(language(`network/networkfollow:NEED_TARGET_PROFILE_SERVER`))

  // Check if the user is already following the user specified in the command
  const isAlreadyFollowing = targetUsersProfileGuildSettings.network.channelIDs.followers.includes(
    usersProfileGuildSettings.network.channelIDs.feed
  )

  // Remove the users feed channel from the targets followers
  if (isAlreadyFollowing)
    targetUsersProfileGuildSettings.network.channelIDs.followers = targetUsersProfileGuildSettings.network.channelIDs.followers.filter(
      id => id !== usersProfileGuildSettings.network.channelIDs.feed
    )
  // Add the users feed channel to the targets followers
  else
    targetUsersProfileGuildSettings.network.channelIDs.followers.push(usersProfileGuildSettings.network.channelIDs.feed)

  targetUsersProfileGuildSettings.save()

  message.channel.createMessage(
    language(isAlreadyFollowing ? `network/networkfollow:UNFOLLOWED` : `network/networkfollow:FOLLOWED`, {
      user: user.username
    })
  )

  const notificationChannel = targetUsersProfileGuildSettings.network.channelIDs.notifications
    ? Gamer.getChannel(targetUsersProfileGuildSettings.network.channelIDs.notifications)
    : undefined

  if (!notificationChannel || !(notificationChannel instanceof TextChannel)) return

  return notificationChannel.createMessage(
    language(isAlreadyFollowing ? `network/networkfollow:ADD_FOLLOWER` : `network/networkfollow:LOSE_FOLLOWER`, {
      username: `${user.username}#${user.discriminator}`,
      id: user.id
    })
  )
})
