import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, Constants } from 'eris'
import GamerEmbed from '../lib/structures/GamerEmbed'
import constants from '../constants'

export default new Command(`networkcreate`, async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  // Make sure the bot has the permissions to create channels
  const botMember = message.channel.guild.members.get(Gamer.user.id)
  if (!botMember || !botMember.permission.has('manageChannels')) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })
  const userSettings = await Gamer.database.models.user.findOne({ userID: message.author.id })
  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  // If this server is already setup as a networked server cancel
  if (guildSettings?.network.channelIDs.wall)
    return message.channel.createMessage(language(`network/networkcreate:ALREADY_NETWORKED`))
  // If this user has already created his own networked server cancel
  if (userSettings?.network.guildID) {
    const guild = Gamer.guilds.get(userSettings.network.guildID)
    if (guild) return message.channel.createMessage(language(`network/networkcreate:ONLY_ONE`, { guild: guild.name }))
  }

  message.channel.createMessage(language(`network/networkcreate:PATIENCE`))

  const embed = new GamerEmbed()
    .setAuthor(`${message.author.username}-${message.author.discriminator}`, message.author.avatarURL)
    .setColor('RANDOM')
    .setDescription(language(`network/networkcreate:FIRST_MESSAGE`))
    .setFooter(message.author.id)
    .setTimestamp()

  try {
    const categoryChannel = await message.channel.guild.createChannel(
      language(`network/networkcreate:CATEGORY_NAME`),
      4
    )

    // Create the wall channel and deny send and add reactions permissions from everyone but the bot must have them
    const wallChannel = await message.channel.guild.createChannel(language(`network/networkcreate:WALL_NAME`), 0, {
      parentID: categoryChannel.id,
      permissionOverwrites: [
        {
          id: message.channel.guild.id,
          allow: Constants.Permissions.readMessages,
          deny: Constants.Permissions.sendMessages,
          type: `role`
        },
        // Allows the bot to read, send, embed, addreactions, external emojis
        { id: Gamer.user.id, allow: 355392, deny: 0, type: `member` }
      ]
    })

    const firstMessage = await wallChannel.createMessage({ embed: embed.code })
    // Await to keep proper order
    for (const reaction of [constants.emojis.heart, constants.emojis.repeat, constants.emojis.plus]) {
      const validReaction = Gamer.helpers.discord.convertEmoji(reaction, `reaction`)
      if (validReaction) await firstMessage.addReaction(validReaction)
    }

    // Create the notifications channel which no one can see
    const notificationsChannel = await message.channel.guild.createChannel(
      language(`network/networkcreate:NOTIFICATION_NAME`),
      0,
      {
        parentID: categoryChannel.id,
        permissionOverwrites: [
          { id: message.channel.guild.id, allow: 0, deny: Constants.Permissions.readMessages, type: `role` },
          { id: Gamer.user.id, allow: 355392, deny: 0, type: `member` }
        ]
      }
    )

    const photosChannel = await message.channel.guild.createChannel(language(`network/networkcreate:PHOTOS_NAME`), 0, {
      parentID: categoryChannel.id,
      permissionOverwrites: [
        { id: message.channel.guild.id, allow: 0, deny: Constants.Permissions.sendMessages, type: `role` },
        { id: Gamer.user.id, allow: 355392, deny: 0, type: `member` }
      ]
    })

    // Create the feed channel which no one can see
    const feedChannel = await message.channel.guild.createChannel(language(`network/networkcreate:FEED_NAME`), 0, {
      parentID: categoryChannel.id,
      permissionOverwrites: [
        { id: message.channel.guild.id, allow: 0, deny: Constants.Permissions.readMessages, type: `role` },
        { id: Gamer.user.id, allow: 355392, deny: 0, type: `member` }
      ]
    })

    // Update the settings with all the new channels created
    if (!guildSettings)
      await Gamer.database.models.guild.create({
        id: message.channel.guild.id,
        network: {
          channelIDs: {
            followers: [],
            wall: wallChannel.id,
            notifications: notificationsChannel.id,
            feed: feedChannel.id,
            photos: photosChannel.id
          }
        }
      })
    else {
      guildSettings.network.channelIDs.wall = wallChannel.id
      guildSettings.network.channelIDs.notifications = notificationsChannel.id
      guildSettings.network.channelIDs.feed = feedChannel.id
      guildSettings.network.channelIDs.photos = photosChannel.id
      guildSettings.save()
    }
    if (!userSettings)
      await Gamer.database.models.user.create({
        userID: message.author.id,
        network: {
          followerIDs: [],
          guildID: message.channel.guild.id
        }
      })
    else {
      userSettings.network.guildID = message.channel.guild.id
      userSettings.save()
    }

    // Alert the user that it is done
    return message.channel.createMessage(language(`network/networkcreate:CREATED`, { mention: message.author.mention }))
  } catch (error) {
    Gamer.emit('error', error)
    // Alert the user that something went wrong
    return message.channel.createMessage(language(`network/networkcreate:FAILED`, { mention: message.author.mention }))
  }
})
