import Monitor from '../lib/structures/Monitor'
import { Message, PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GamerTag } from '../lib/types/gamer'
import constants from '../constants'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    if (message.channel instanceof PrivateChannel) return

    const lowercaseContent = message.content.toLowerCase()
    const [firstWord] = lowercaseContent.split(' ')

    const validTags: GamerTag[] = []

    for (const tagData of Gamer.tags.values()) {
      // If it is a mail only tag skip
      if (tagData.mailOnly) continue
      // Tag name not found in the entire message
      if (!lowercaseContent.includes(tagData.name)) continue
      // If the tag is not from this server and it is not from a module server skip
      if (
        tagData.guildID !== message.channel.guild.id &&
        constants.modules.servers.find(server => server.id === tagData.guildID)
      )
        continue
      // If its basic type and the first word is not the tag name skip
      if (`basic` === tagData.type && firstWord !== tagData.name) continue
      // This should be a valid tag to run
      validTags.push(tagData)
    }

    // If there were no valid tags just cancel
    if (!validTags.length) return

    const guildSettings = await Gamer.database.models.guild.findOne({
      id: message.channel.guild.id
    })

    const disabledChannels = guildSettings ? guildSettings.tags.disabledChannels : []
    if (disabledChannels.includes(message.channel.id)) return

    const enabledModules = guildSettings ? guildSettings.modules : []

    const emojis = await Gamer.database.models.emoji.find()

    for (const tag of validTags) {
      // This tag is a module tag so check if the module is enabled
      if (tag.guildID !== message.channel.guild.id && enabledModules.includes(message.channel.guild.id)) continue

      // Valid tag to post

      Gamer.emit(`processXP`, message, Gamer)

      const transformed = Gamer.helpers.transform.variables(
        tag.embedCode,
        message.author,
        message.channel.guild,
        message.author,
        emojis
      )
      // Not an embed
      if (!transformed.startsWith('{')) return message.channel.createMessage(transformed)

      try {
        const json = JSON.parse(transformed)
        message.channel.createMessage({ content: json.plaintext, embed: json })
      } catch {}

      // Only ever run one tag at a time to prevent spam so we need return here
      return Gamer.helpers.logger.green(
        `Tag ${tag.name} of type ${tag.type} ran in ${message.channel.name} channel in ${message.channel.guild.name} by ${message.author.username}`
      )
    }
  }
}
