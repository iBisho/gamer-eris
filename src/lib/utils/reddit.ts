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
  if (name.startsWith('r/')) name = name.substring(2)
  const data = await fetchRSSFeed(`https://reddit.com/r/${name}/new.rss`)
  if (!data?.items) return []

  return data.items.map(item => {
    const content = turndownService.turndown(item.content || 'Content not available.')
    const hasImage = content.startsWith(' [![')
    let imageURL = ''
    if (hasImage) {
      const reddIndex = content.indexOf('https://i.redd.it')
      const previewIndex = content.indexOf('https://preview.')
      const httpIndex = content.indexOf('http')
      const startIndex = reddIndex >= 0 ? reddIndex : previewIndex >= 0 ? previewIndex : httpIndex
      const start = content.substring(startIndex)
      const pngIndex = start.indexOf('.png')
      const jpgIndex = start.indexOf('.jpg')
      const endIndex = (pngIndex >= 0 ? pngIndex : jpgIndex) + 4

      imageURL = start.substring(0, endIndex).replace('preview.redd.it', 'i.redd.it')
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
  Gamer.helpers.logger.green('Processing Reddit Subscriptions')
  const redditSubs = await Gamer.database.models.subscription.find({ type: GamerSubscriptionType.REDDIT })
  const validReactions = [constants.emojis.voteup, constants.emojis.votedown]
    .map(reaction => Gamer.helpers.discord.convertEmoji(reaction, `reaction`)!)
    .filter(reaction => reaction)

  for (const redditSub of redditSubs) {
    Gamer.helpers.logger.green(`Reddit Subs: ${redditSub.username}`)
    if (!redditSub.subs.length) continue

    const posts = await fetchLatestRedditPosts(redditSub.username)
    Gamer.helpers.logger.green(`[Reddit]: ${redditSub.username} ${posts.length} posts fetched.`)
    if (!posts.length) continue

    redditSub.subs.forEach(sub => {
      const latestIndex = posts.findIndex(post => post.link === sub.latestLink)
      const latestPosts = latestIndex > 0 ? posts.slice(0, latestIndex) : latestIndex === 0 ? [] : posts
      console.log(sub.guildID, redditSub.username, latestIndex, latestPosts.length, posts.length, sub.latestLink)
      Gamer.helpers.logger.green(`[Reddit]: ${redditSub.username} ${latestPosts.length} latest posts found.`)

      for (const post of latestPosts.reverse()) {
        if (!post.link || !post.title) continue

        sub.latestLink = post.link

        // If there is a filter and the title does not have the filter
        if (
          sub.game &&
          !post.title.toLowerCase().split(' ').includes(sub.game) &&
          !post.content.toLowerCase().split(' ').includes(sub.game)
        )
          continue

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
        })
          .then(message => message && validReactions.forEach(reaction => message.addReaction(reaction)))
          .catch(error => {
            console.log('Reddit Embed Sending Error:', error)
            console.log('Reddit Embed Sending Error 2:', embed.code)
          })
      }
    })

    await redditSub.save()
  }

  setTimeout(() => processRedditSubscriptions(), milliseconds.MINUTE * 3)
}
