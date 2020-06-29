import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { Constants } from 'eris'
import { MessageEmbed } from 'helperis'
import constants from '../../constants'

export default new Command(`networkcreate`, async (message, _args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient

  // Make sure the bot has the permissions to create channels
  const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!botMember || !botMember.permission.has('manageChannels')) return

  const language = Gamer.getLanguage(message.guildID)

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
  const userSettings = await Gamer.database.models.user.findOne({ userID: message.author.id })
  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  // If this server is already setup as a networked server cancel
  if (
    guildSettings?.network.channelIDs.wall &&
    message.member.guild.channels.has(guildSettings.network.channelIDs.wall)
  )
    return message.channel.createMessage(language(`network/networkcreate:ALREADY_NETWORKED`))
  // If this user has already created his own networked server cancel
  if (userSettings?.network.guildID) {
    const guild = Gamer.guilds.get(userSettings.network.guildID)
    if (guild) {
      const usersGuildSettings = await Gamer.database.models.guild.findOne({ guildID: guild.id })
      if (usersGuildSettings?.network.channelIDs.wall && guild.channels.has(usersGuildSettings.network.channelIDs.wall))
        return message.channel.createMessage(language(`network/networkcreate:ONLY_ONE`, { guild: guild.name }))
    }
  }

  message.channel.createMessage(language(`network/networkcreate:PATIENCE`))

  const embed = new MessageEmbed()
    .setAuthor(`${message.author.username}-${message.author.discriminator}`, message.author.avatarURL)
    .setColor('RANDOM')
    .setDescription(language(`network/networkcreate:FIRST_MESSAGE`))
    .setFooter(message.author.id)
    .setTimestamp()

  try {
    const categoryChannel = await message.member.guild.createChannel(language(`network/networkcreate:CATEGORY_NAME`), 4)

    // Create the wall channel and deny send and add reactions permissions from everyone but the bot must have them
    const wallChannel = await message.member.guild.createChannel(language(`network/networkcreate:WALL_NAME`), 0, {
      parentID: categoryChannel.id,
      permissionOverwrites: [
        {
          id: message.guildID,
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
    const notificationsChannel = await message.member.guild.createChannel(
      language(`network/networkcreate:NOTIFICATION_NAME`),
      0,
      {
        parentID: categoryChannel.id,
        permissionOverwrites: [
          { id: message.guildID, allow: 0, deny: Constants.Permissions.readMessages, type: `role` },
          { id: Gamer.user.id, allow: 355392, deny: 0, type: `member` }
        ]
      }
    )

    const photosChannel = await message.member.guild.createChannel(language(`network/networkcreate:PHOTOS_NAME`), 0, {
      parentID: categoryChannel.id,
      permissionOverwrites: [
        { id: message.guildID, allow: 0, deny: Constants.Permissions.sendMessages, type: `role` },
        { id: Gamer.user.id, allow: 355392, deny: 0, type: `member` }
      ]
    })

    // Create the feed channel which no one can see
    const feedChannel = await message.member.guild.createChannel(language(`network/networkcreate:FEED_NAME`), 0, {
      parentID: categoryChannel.id,
      permissionOverwrites: [
        { id: message.guildID, allow: 0, deny: Constants.Permissions.readMessages, type: `role` },
        { id: Gamer.user.id, allow: 355392, deny: 0, type: `member` }
      ]
    })

    // Update the settings with all the new channels created
    if (!guildSettings) {
      const gs = new Gamer.database.models.guild({
        guildID: message.guildID,
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
      await gs.save()
    } else {
      guildSettings.network.channelIDs.wall = wallChannel.id
      guildSettings.network.channelIDs.notifications = notificationsChannel.id
      guildSettings.network.channelIDs.feed = feedChannel.id
      guildSettings.network.channelIDs.photos = photosChannel.id
      guildSettings.save()
    }
    if (!userSettings) {
      const network = new Gamer.database.models.user({
        userID: message.author.id,
        network: {
          guildID: message.guildID
        },
        guildIDs: [message.guildID]
      })
      await network.save()
    } else {
      userSettings.network.guildID = message.guildID
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
