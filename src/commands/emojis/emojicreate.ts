import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`emojicreate`, `emc`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const [name, emoji] = args
  if (!name) return message.channel.createMessage(language(`emojis/emojicreate:NEED_NAME`))
  if (!emoji) return message.channel.createMessage(language(`emojis/emojicreate:NEED_EMOJI`))

  const validEmoji = Gamer.helpers.discord.convertEmoji(emoji, `data`)
  if (!validEmoji) return message.channel.createMessage(language(`emojis/emojicreate:NEED_VALID_EMOJI`))

  const emojiExists = await Gamer.database.models.emoji.findOne({ emojiID: validEmoji.id })
  const nameExists = await Gamer.database.models.emoji.findOne({ name: name.toLowerCase() })
  if (emojiExists)
    return message.channel.createMessage(language(`emojis/emojicreate:EMOJI_EXISTS`, { name: emojiExists.name }))
  if (nameExists) return message.channel.createMessage(language(`emojis/emojicreate:NAME_EXISTS`, { name }))

  const payload = await Gamer.database.models.emoji.create({
    authorID: message.author.id,
    emojiID: validEmoji.id,
    fullCode: `<${validEmoji.animated ? `a` : ``}:${validEmoji.name}:${validEmoji.id}>`,
    guildID: message.guildID,
    name: name.toLowerCase()
  })

  return message.channel.createMessage(
    language(`emojis/emojicreate:CREATED`, { name: name.toLowerCase(), emoji: payload.fullCode })
  )
})
