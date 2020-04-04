import { Command } from 'yuuko'
import fetch from 'node-fetch'
import GamerClient from '../../lib/structures/GamerClient'
import { parse } from 'url'
import config from '../../../config'
import { MessageEmbed } from 'helperis'
import { GuildTextableChannel } from 'eris'

export default new Command(`imgur`, async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const [attachment] = message.attachments
  const content = args.join(` `)
  const url = attachment ? attachment.url : content ? content : undefined
  if (!url) return message.channel.createMessage(language(`utility/imgur:MISSING_URL`))

  if (url.includes(`imgur.com`)) return message.channel.createMessage(language(`utility/imgur:ALREADY_IMGUR`, { url }))

  // Check if the user has permission to post images
  const hasPermsToPostImages = (message.channel as GuildTextableChannel)
    .permissionsOf(message.author.id)
    .has('attachFiles')
  if (!hasPermsToPostImages) return message.channel.createMessage(language(`utility/imgur:MISSING_PERMISSION`))

  const parsedURL = parse(url)
  const validURL = parsedURL.protocol && parsedURL.hostname ? url : undefined
  if (!validURL) return message.channel.createMessage(language(`utility/imgur:INVALID_URL`))

  const result = (await fetch(`https://api.imgur.com/3/image`, {
    method: `POST`,
    headers: { Authorization: `Client-ID ${config.apiKeys.imgur.id}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: validURL, type: `url` })
  })
    .then(res => res.json())
    .catch(() => undefined)) as Imgur | undefined

  if (!result || result.status !== 200) return message.channel.createMessage(language(`utility/imgur:FAILED`))

  const embed = new MessageEmbed()
    .setDescription(language(`utility/imgur:LINK`, { link: result.data.link }))
    .setImage(result.data.link)

  // For mobile users send the link in plain text so they can copy paste since embeds cant be copied
  return message.channel.createMessage({ content: `<${result.data.link}>`, embed: embed.code })
})

export interface Imgur {
  data: Data
  success: boolean
  status: number
}

export interface Data {
  id: string
  title: null
  description: null
  datetime: number
  type: string
  animated: boolean
  width: number
  height: number
  size: number
  views: number
  bandwidth: number
  vote: null
  favorite: boolean
  nsfw: null
  section: null
  account_url: null
  account_id: number
  is_ad: boolean
  in_most_viral: boolean
  has_sound: boolean
  tags: unknown[]
  ad_type: number
  ad_url: string
  edited: string
  in_gallery: boolean
  deletehash: string
  name: string
  link: string
  error: string
  request: string
  method: string
}
