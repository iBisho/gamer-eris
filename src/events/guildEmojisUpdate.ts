import Event from '../lib/structures/Event'
import { TextChannel, Guild, Emoji } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default class extends Event {
  async execute(guild: Guild, emojis: Emoji[], oldEmojis: Emoji[]) {
    // Only need emoji create and emoji delete so if the same amount we can ignore
    if (emojis.length === oldEmojis.length) return

    const Gamer = guild.shard.client as GamerClient
    const language = Gamer.i18n.get(Gamer.guildLanguages.get(guild.id) || `en-US`)
    if (!language) return

    const emojiCreated = emojis.length > oldEmojis.length
    // Find the emoji that was created/deleted
    const emoji = emojiCreated
      ? emojis.find(e => !oldEmojis.some(em => em.id === e.id))
      : oldEmojis.find(e => !emojis.some(em => em.id === e.id))
    if (!emoji) return

    const emojiURL = `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? `gif` : `png`}`

    const guildSettings = await Gamer.database.models.guild.findOne({ id: guild.id })
    // If there is no channel set for logging this cancel
    if (!guildSettings?.moderation.logs.serverlogs.emojis.channelID) return

    const embed = new GamerEmbed()
      .setTitle(language(emojiCreated ? `moderation/logs:EMOJI_CREATED` : `moderation/logs:EMOJI_DELETED`), emojiURL)
      .addField(language(`moderation/logs:EMOJI_ANIMATED`), emoji.animated.toString(), true)
      .addField(
        language(`moderation/logs:USER`),
        `<@${emoji.user.id}> (${emoji.user.name}#${emoji.user.discriminator})`,
        true
      )
      .addField(language(`moderation/logs:USER_ID`), emoji.user.id, true)
      .addField(language(`moderation/logs:NAME`), emoji.name, true)
      .addField(language(`moderation/logs:TOTAL_EMOJIS`), emojis.length.toString(), true)
      .setFooter(emoji.name, guild.iconURL)
      .setThumbnail(emojiURL)
      .setTimestamp()

    const logs = guildSettings.moderation.logs

    // If public logs are enabled properly then send the embed there
    if (logs.serverlogs.emojis.createPublicEnabled && logs.publiclogsChannelID) {
      const publicLogChannel = guild.channels.get(logs.publiclogsChannelID)
      if (publicLogChannel instanceof TextChannel) {
        const botPerms = publicLogChannel.permissionsOf(Gamer.user.id)
        if (publicLogChannel && botPerms.has('embedLinks')) publicLogChannel.createMessage({ embed: embed.code })
      }
    }

    // Send the finalized embed to the log channel
    const logChannel = guild.channels.get(guildSettings.moderation.logs.serverlogs.emojis.channelID)
    if (logChannel instanceof TextChannel) {
      const botPerms = logChannel.permissionsOf(Gamer.user.id)
      if (botPerms.has(`embedLinks`) && botPerms.has(`readMessages`) && botPerms.has(`sendMessages`))
        logChannel.createMessage({ embed: embed.code })
    }
  }
}
