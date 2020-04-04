import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { TextChannel } from 'eris'

export default new Command(`embedset`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const [channelID] = message.channelMentions
  const channel = channelID ? message.member.guild.channels.get(channelID) : message.channel
  if (!channel || !(channel instanceof TextChannel)) return

  const [messageID] = args
  if (!messageID) return
  // Remove the id so only thing left is the embed code
  args.shift()
  // If there was no JSON code given then cancel out
  if (!args.length) return message.channel.createMessage(language(`embedding/embededit:NEED_ARGS`))
  const messageToUse = channel.messages.get(messageID) || (await Gamer.getMessage(channel.id, messageID))
  if (!messageToUse || messageToUse.author.id !== Gamer.user.id) return

  const [embed] = messageToUse.embeds
  if (!embed) return

  const settings = await Gamer.database.models.guild.findOne({ id: message.guildID })
  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isModOrAdmin(message, settings)) return

  const emojis = await Gamer.database.models.emoji.find()

  const [type] = args
  args.shift()
  if (!type) return

  const transformed = Gamer.helpers.transform.variables(
    args.join(' '),
    message.mentions[0],
    message.member.guild,
    message.author,
    emojis
  )

  switch (type.toLowerCase()) {
    case 'description':
      embed.description = transformed
      break
    case 'title':
      embed.title = transformed
      break
    case 'thumbnail':
      embed.thumbnail = { url: transformed }
      break
    case 'image':
      embed.image = { url: transformed }
      break
  }

  messageToUse.edit({
    content: type === 'plainText' ? transformed : messageToUse.content,
    embed
  })

  return message.channel.createMessage(language(`embedding/embedset:SUCCESS`, { type }))
})
