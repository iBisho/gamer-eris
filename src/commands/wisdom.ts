import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'
import fetch from 'node-fetch'

export default new Command(`wisdom`, async (message, _args, context) => {
  const language = (context.client as GamerClient).i18n.get('en-US')
  if (!language) return null

  const data: Wisdom | null = await fetch(`https://favqs.com/api/qotd`)
    .then(res => res.json())
    .catch(() => null)

  if (!data) return message.channel.createMessage(language(`fun/advice:ERROR`))

  const embed = new GamerEmbed()
    .setDescription(data.quote.body)
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.defaultAvatarURL
    )

  return message.channel.createMessage({ embed: embed.code })
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
