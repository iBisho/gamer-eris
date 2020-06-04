import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`emojiinfo`, `emoji`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const [nameOrID] = args
  if (!nameOrID) return message.channel.createMessage(language(`emojis/emojiinfo:NEED_NAME_OR_ID`))

  // Find the emoji in the guild
  const emoji = message.member.guild.emojis.find(emoji =>
    parseInt(nameOrID) ? emoji.id === nameOrID : emoji.name === nameOrID
  )

  if (!emoji) return message.channel.createMessage(language(`emojis/emojiinfo:DOESNT_EXIST`, { nameOrID }))

  const embed = new MessageEmbed()
    .setAuthor(message.member.guild.name, message.member.guild.dynamicIconURL(undefined, 2048))
    .setThumbnail(`https://cdn.discord.com/emojis/${emoji.id}.${emoji.animated ? `gif` : `png`}`)
    .addField(language(`emojis/emojiinfo:NAME`), emoji.name, true)
    .addField(language(`emojis/emojiinfo:ID`), emoji.id, true)
    .addField(language(`emojis/emojiinfo:ANIMATED`), Gamer.helpers.discord.booleanEmoji(emoji.animated))
    .addField(language(`emojis/emojiinfo:MANAGED`), Gamer.helpers.discord.booleanEmoji(emoji.managed), true)
  message.channel.createMessage({ embed: embed.code })
})
