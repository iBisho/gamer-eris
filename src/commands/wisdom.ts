import { Command } from 'yuuko'
import fetch from 'node-fetch'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { PrivateChannel, GroupChannel } from 'eris'

export default new Command(`wisdom`, async (message, _args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const data: Wisdom | null = await fetch(`https://favqs.com/api/qotd`)
    .then(res => res.json())
    .catch(() => null)

  if (!data || !data.quote.body) return message.channel.createMessage(language(`fun/advice:ERROR`))

  const embed = new GamerEmbed()
    .setDescription(data.quote.body)
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.avatarURL
    )

  message.channel.createMessage({ embed: embed.code })
  return Gamer.helpers.levels.completeMission(message.member, `wisdom`, message.channel.guild.id)
})

export interface Wisdom {
  qotd_date: Date
  quote: Quote
}

export interface Quote {
  id: number
  dialogue: boolean
  private: boolean
  tags: string[]
  url: string
  favorites_count: number
  upvotes_count: number
  downvotes_count: number
  author: string
  author_permalink: string
  body: string
}
