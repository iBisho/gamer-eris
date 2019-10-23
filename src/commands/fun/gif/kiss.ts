import { Command } from 'yuuko'
import fetch from 'node-fetch'
import GamerClient from '../../../lib/structures/GamerClient'
import GamerEmbed from '../../../lib/structures/GamerEmbed'

export default new Command(`kiss`, async (message, _args, context) => {
  const language = (context.client as GamerClient).i18n.get('en-US')
  if (!language) return null

  const data: TenorGif | null = await fetch(`https://api.tenor.com/v1/search?q=kiss&key=LIVDSRZULELA&limit=50`)
    .then(res => res.json())
    .catch(() => null)

  if (!data || !data.results.length) return message.channel.createMessage(language(`fun/advice:ERROR`))
  const randomResult = data.results[Math.floor(Math.random() * (data.results.length - 1))]
  const [media] = randomResult.media

  const user = message.mentions.length ? message.mentions[0] : message.author

  const embed = new GamerEmbed()
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.defaultAvatarURL
    )
    .setDescription(
      language(user.id === message.author.id ? `fun/kiss:SELF` : `fun/kiss:REPLY`, {
        mention: user.mention,
        author: message.author.mention
      })
    )
    .setImage(media.gif.url)
    .setFooter(`Via Tenor`)

  return message.channel.createMessage({ embed: embed.code })
})

export interface TenorGif {
  weburl: string
  results: TenorGifData[]
}

export interface TenorGifData {
  tags: string[]
  url: string
  media: Media[]
  created: number
  shares: number
  itemurl: string
  composite: null
  hasaudio: boolean
  title: string
  id: string
}

export interface Media {
  nanomp4: MediaData
  nanowebm: MediaData
  tinygif: MediaData
  tinymp4: MediaData
  tinywebm: MediaData
  webm: MediaData
  gif: MediaData
  mp4: MediaData
  loopedmp4: MediaData
  mediumgif: MediaData
  nanogif: MediaData
}

export interface MediaData {
  url: string
  dims: number[]
  preview: string
  size: number
  duration?: number
}
