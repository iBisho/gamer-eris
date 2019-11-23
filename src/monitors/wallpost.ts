import Monitor from '../lib/structures/Monitor'
import { Message, PrivateChannel, TextChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'
import constants from '../constants'

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
    // Network features only work in dms
    if (message.channel instanceof PrivateChannel || !message.member) return
    // Check if bot has necessary permissions
    if (!Gamer.helpers.discord.checkPermissions(message.channel, Gamer.user.id, postPermissions)) return
    // Only server admins can post in the wall channels
    if (!message.member.permission.has('administrator')) return

    const guildSettings = await Gamer.database.models.guild.findOne({
      id: message.channel.guild.id
    })

    // Either the guild doesnt have custom settings or the wall channel wasnt setup or this isnt in the wall channel
    if (!guildSettings?.network.channelIDs.wall || guildSettings.network.channelIDs.wall !== message.channel.id) return

    const imageURL = message.attachments.length ? message.attachments[0].url : null

    const embed = new GamerEmbed()
      .setAuthor(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
      .setColor('RANDOM')
      .setDescription(message.content)
      .setFooter(message.author.id)
      .setTimestamp()
    if (imageURL) embed.setImage(imageURL)

    try {
      // Send the message the user posted as an embed
      const posted = await message.channel.createMessage({ embed: embed.code })
      // Add the reactions to the message
      for (const reaction of postReactions) {
        const validReaction = Gamer.helpers.discord.convertEmoji(reaction, `reaction`)
        if (validReaction) posted.addReaction(validReaction)
      }

      // Delete the original message the author posted to keep channel clean. Catch it because it mightve been deleted by another monitor
      await message.delete().catch(() => null)

      // If an image was attached post the image in #photos
      if (imageURL) {
        const photosChannel = guildSettings.network.channelIDs.photos
          ? message.channel.guild.channels.get(guildSettings.network.channelIDs.photos)
          : null

        // Make sure the channel exists and bot has perms in it before sending
        if (photosChannel && photosChannel instanceof TextChannel) {
          if (
            Gamer.helpers.discord.checkPermissions(photosChannel, Gamer.user.id, [
              'readMessages',
              'sendMessages',
              'embedLinks'
            ])
          ) {
            await photosChannel.createMessage({ embed: embed.code })
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

          const reposted = await feedChannel.createMessage({ embed: embed.code })

          // This is waterfall for consistency. We want the reactions to be in a specific order
          for (const reaction of postReactions) await reposted.addReaction(reaction)
        })
      )

      Gamer.helpers.logger.green(
        `New Post In Wall Channel By ${message.author.username} in ${message.channel.guild.name} and send to ${guildSettings.network.channelIDs.followers.length} followers.`
      )
    } catch (error) {
      Gamer.emit('error', error)
    }
  }
}
