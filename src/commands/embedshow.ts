import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { TextChannel } from 'eris'
import { MessageEmbed } from 'helperis'

export default new Command(`embedshow`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const [channelID] = message.channelMentions
  const channel = channelID ? message.member.guild.channels.get(channelID) : message.channel
  if (!channel || !(channel instanceof TextChannel)) return

  const [messageID] = args
  if (!messageID) return

  const messageToUse =
    channel.messages.get(messageID) || (await Gamer.getMessage(channel.id, messageID).catch(() => undefined))
  if (!messageToUse) return

  const [embed] = messageToUse.embeds
  if (!embed) return

  const settings = await Gamer.database.models.guild.findOne({ id: message.guildID })

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isModOrAdmin(message, settings)) return

  const payload: string[] = []
  const fields =
    embed.fields && embed.fields.length
      ? embed.fields.map(field => `{ "name": "${field.name}", "value": "${field.value}", "inline": ${field.inline}}`)
      : []
  if (embed.title) payload.push(`"title": "${embed.title}"`)
  if (embed.description) payload.push(`"description": "${embed.description}"`)
  if (embed.color) payload.push(`"color": ${embed.color}`)
  if (embed.author)
    payload.push(
      `"author": { "name": "${embed.author.name}", "icon_url": "${embed.author.icon_url}", "url": "${embed.author.url}"}`
    )
  if (fields.length) payload.push(`"fields": [${fields.join(', ')}]`)
  if (embed.url) payload.push(`"url": "${embed.url}"`)
  if (embed.image) payload.push(`"image": { "url": "${embed.image.url}" }`)
  if (embed.timestamp) payload.push(`"timestamp": ${embed.timestamp}`)
  if (embed.footer) payload.push(`"footer": { "text": "${embed.footer.text}", "icon_url": "${embed.footer.icon_url}" }`)

  // Show the embed

  const responseEmbed = new MessageEmbed().setDescription(['```json', `{${payload.join(', ')}}`, '```'].join('\n'))
  message.channel.createMessage({ embed: responseEmbed.code })
})
