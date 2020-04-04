import { Command } from 'yuuko'
import fetch from 'node-fetch'
import GamerClient from '../../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'

export default new Command(`wisdom`, async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const data: Wisdom | undefined = await fetch(`https://favqs.com/api/qotd`)
    .then(res => res.json())
    .catch(() => undefined)

  if (!data || !data.quote.body) return message.channel.createMessage(language(`fun/advice:ERROR`))

  const embed = new MessageEmbed()
    .setDescription(data.quote.body)
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.avatarURL
    )

  message.channel.createMessage({ embed: embed.code })
  if (message.member && message.guildID)
    return Gamer.helpers.levels.completeMission(message.member, `wisdom`, message.guildID)
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
