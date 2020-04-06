import Monitor from '../lib/structures/Monitor'
import { Message } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GamerTag } from '../lib/types/gamer'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    if (!message.guildID || !message.member) return

    const hasPermissions = Gamer.helpers.discord.checkPermissions(message.channel, Gamer.user.id, [
      `sendMessages`,
      `embedLinks`,
      `externalEmojis`
    ])
    if (!hasPermissions) return

    const lowercaseContent = message.content.toLowerCase()
    const [firstWord] = lowercaseContent.split(' ')

    const validTags: GamerTag[] = []

    for (const tagData of Gamer.tags.values()) {
      // If it is a mail only tag skip
      if (tagData.mailOnly) continue
      // Tag name not found in the entire message
      if (!lowercaseContent.includes(tagData.name)) continue
      // If its basic type and the first word is not the tag name skip
      if (`basic` === tagData.type && firstWord !== tagData.name) continue
      // This should be a valid tag to run
      validTags.push(tagData)
    }

    // If there were no valid tags just cancel
    if (!validTags.length) return

    const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })

    const disabledChannels = guildSettings ? guildSettings.tags.disabledChannels : []
    if (disabledChannels.includes(message.channel.id)) return

    const enabledModules = guildSettings ? guildSettings.modules : []

    const emojis = await Gamer.database.models.emoji.find()

    for (const tag of validTags) {
      // This tag is a module tag so check if the module is enabled
      if (tag.guildID !== message.guildID) {
        // This servers tags were not installed so skip
        if (!enabledModules.includes(tag.guildID)) continue
        // Make sure this tag was made as a public tag by the original server
        if (tag.isPublic) continue
      }

      // Valid tag to post

      Gamer.emit(`processXP`, message, Gamer)

      const transformed = await Gamer.helpers.transform.variables(
        tag.embedCode,
        message.author,
        message.member.guild,
        message.author,
        emojis
      )
      // Not an embed
      if (!transformed.startsWith('{')) {
        message.channel.createMessage(transformed)
        return
      }

      try {
        const json = JSON.parse(transformed)
        if (typeof json.image === 'string') json.image = { url: json.image }
        if (typeof json.thumbnail === 'string') json.thumbnail = { url: json.thumbnail }
        if (json.color === 'RANDOM') json.color = Math.floor(Math.random() * (0xffffff + 1))
        if (json.timestamp) json.timestamp = new Date().toISOString()
        await message.channel.createMessage({ content: json.plaintext, embed: json })
      } catch {}

      // Only ever run one tag at a time to prevent spam so we need return here
      return
    }
  }
}
