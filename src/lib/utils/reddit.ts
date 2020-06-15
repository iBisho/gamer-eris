import { fetchRSSFeed } from './rss'
import Gamer from '../..'
import { GamerSubscriptionType } from '../../database/schemas/subscription'
import { sendMessage } from './eris'
import { MessageEmbed } from 'helperis'
import TurndownService from 'turndown'
import constants from '../../constants'
import { milliseconds } from '../types/enums/time'

const turndownService = new TurndownService()

export async function fetchLatestRedditPosts(name: string) {
  const data = await fetchRSSFeed(`https://reddit.com/r/${name}/new.rss`)
  if (!data?.items) return []

  return data.items.map(item => {
    const content = turndownService.turndown(item.content || 'Content not available.')
    const hasImage = content.startsWith(' [![')
    let imageURL = ''
    if (hasImage) {
      const reddIndex = content.indexOf('https://i.redd.it')
      const previewIndex = content.indexOf('https://preview.')
      const startIndex = reddIndex >= 0 ? reddIndex : previewIndex
      const start = content.substring(startIndex)
      const pngIndex = start.indexOf('.png')
      const jpgIndex = start.indexOf('.jpg')
      const endIndex = (pngIndex >= 0 ? pngIndex : jpgIndex) + 4

      imageURL = start.substring(0, endIndex)
    }

    return {
      title: item.title,
      link: item.link,
      date: item.isoDate,
      author: `[${item.author}](https://reddit.com/user/${item.author})`,
      content: content.substring(0, content.indexOf('submitted by [/u/')),
      imageURL
    }
  })
}

export async function processRedditSubscriptions() {
  const redditSubs = await Gamer.database.models.subscription.find({ type: GamerSubscriptionType.REDDIT })
  const validReactions = [constants.emojis.voteup, constants.emojis.votedown]
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .map(reaction => Gamer.helpers.discord.convertEmoji(reaction, `reaction`)!)
    .filter(reaction => reaction)

  for (const redditSub of redditSubs) {
    const posts = await fetchLatestRedditPosts(redditSub.username)
    if (!posts.length) continue

    redditSub.subs.forEach(sub => {
      const latestIndex = posts.findIndex(post => post.link === sub.latestLink)
      const latestPosts = latestIndex > 0 ? posts.slice(0, latestIndex) : latestIndex === 0 ? [] : posts

      latestPosts.reverse().forEach((post, index) => {
        if (!post.link || !post.title) return
        // If there is a filter and the title does not have the filter
        if (sub.game && !post.title.toLowerCase().includes(sub.game) && !post.content.toLowerCase().includes(sub.game))
          return

        const text = sub.text || `**${redditSub.username}** has a new post! @everyone`

        const language = Gamer.getLanguage(sub.guildID)

        const embed = new MessageEmbed()
          .setTitle(post.title || 'Unknown Title', post.link)
          .setAuthor(
            language('utility/reddit:NEW_POST', { name: redditSub.username }),
            'https://i.imgur.com/6UiQy32.jpg'
          )
          .addField(language('utility/reddit:POST_AUTHOR'), post.author)
        if (post.imageURL) embed.setImage(post.imageURL)
        else embed.setDescription(post.content)

        if (post.date) embed.setTimestamp(Date.parse(post.date))

        sendMessage(sub.channelID, {
          content: text,
          allowedMentions: { everyone: true, roles: true, users: true },
          embed: embed.code
        }).then(message => message && validReactions.forEach(reaction => message.addReaction(reaction)))

        if (latestPosts.length - 1 === index) sub.latestLink = post.link
      })
    })

    await redditSub.save()
  }

  setTimeout(() => processRedditSubscriptions(), milliseconds.MINUTE)
}
