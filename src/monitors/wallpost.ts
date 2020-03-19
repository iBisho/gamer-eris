import Monitor from '../lib/structures/Monitor'
import { Message, TextChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'
import constants from '../constants'
import nodefetch from 'node-fetch'

const postReactions = [constants.emojis.heart, constants.emojis.repeat, constants.emojis.plus]
const postPermissions = [
  'readMessages',
  'addReactions',
  'embedLinks',
  'sendMessages',
  'readMessageHistory',
  'externalEmojis',
  'manageMessages'
]

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    if (!message.guildID || !message.member) return
    // Check if bot has necessary permissions
    if (!Gamer.helpers.discord.checkPermissions(message.channel, Gamer.user.id, postPermissions)) return
    // Only server admins can post in the wall channels
    if (!message.member.permission.has('administrator')) return

    const guildSettings = await Gamer.database.models.guild.findOne({
      id: message.guildID
    })

    // Either the guild doesnt have custom settings or the wall channel wasnt setup or this isnt in the wall channel
    if (!guildSettings?.network.channelIDs.wall || guildSettings.network.channelIDs.wall !== message.channel.id) return

    const buffer = message.attachments.length
      ? await nodefetch(message.attachments[0].url)
          .then(res => res.buffer())
          .catch(() => undefined)
      : undefined

    const embed = new MessageEmbed()
      .setAuthor(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
      .setColor('RANDOM')
      .setDescription(message.content)
      .setFooter(message.author.id)
      .setTimestamp()
    if (buffer) embed.attachFile(buffer, 'imagepost.png')

    try {
      // Send the message the user posted as an embed
      const posted = await message.channel.createMessage({ embed: embed.code }, embed.file)
      // Add the reactions to the message
      for (const reaction of postReactions) {
        const validReaction = Gamer.helpers.discord.convertEmoji(reaction, `reaction`)
        if (validReaction) posted.addReaction(validReaction)
      }

      // Delete the original message the author posted to keep channel clean. Catch it because it mightve been deleted by another monitor
      await message.delete().catch(() => undefined)
      if (message.member) Gamer.helpers.levels.completeMission(message.member, `wallpost`, message.guildID)

      // If an image was attached post the image in #photos
      if (buffer) {
        const photosChannel = guildSettings.network.channelIDs.photos
          ? message.member.guild.channels.get(guildSettings.network.channelIDs.photos)
          : undefined

        // Make sure the channel exists and bot has perms in it before sending
        if (photosChannel && photosChannel instanceof TextChannel) {
          if (
            Gamer.helpers.discord.checkPermissions(photosChannel, Gamer.user.id, [
              'readMessages',
              'sendMessages',
              'embedLinks'
            ])
          ) {
            await photosChannel.createMessage({ embed: embed.code }, embed.file)
          }
        }
      }

      // Post the message in every followers feed channel
      await Promise.all(
        guildSettings.network.channelIDs.followers.map(async channelID => {
          const feedChannel = Gamer.getChannel(channelID)

          // If it is not a valid text channel skip
          if (!feedChannel || !(feedChannel instanceof TextChannel)) return
          // Check if the bot has necessary permissions to post in this channel
          if (!Gamer.helpers.discord.checkPermissions(feedChannel, Gamer.user.id, postPermissions)) return

          const reposted = await feedChannel.createMessage({ embed: embed.code }, embed.file)

          // This is waterfall for consistency. We want the reactions to be in a specific order
          for (const reaction of postReactions) {
            const validReaction = Gamer.helpers.discord.convertEmoji(reaction, `reaction`)
            if (validReaction) reposted.addReaction(validReaction)
          }
        })
      )
    } catch (error) {
      Gamer.emit('error', error)
    }
  }
}
