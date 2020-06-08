import Gamer from '../..'
import { GamerSubscriptionType } from '../../database/schemas/subscription'
import { fetchRSSFeed } from './rss'
import nodefetch from 'node-fetch'
import { sendMessage } from './eris'
import { milliseconds } from '../types/enums/time'

const youtubeRSSURL = (id: string) => `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`

export async function fetchChannelIDWithName(name: string) {
  const data = await nodefetch(`https://www.youtube.com/user/${name}/`)
    .then(res => res.text())
    .catch(() => undefined)
  if (!data) return

  const externalIDIndex = data.indexOf('externalId')
  const dataChannelExternalIDIndex = data.indexOf('data-channel-external-id')
  const channelExternalIDIndex = data.indexOf('channel-external-id')

  const finalID =
    externalIDIndex >= 0
      ? externalIDIndex
      : dataChannelExternalIDIndex >= 0
      ? dataChannelExternalIDIndex
      : channelExternalIDIndex

  if (finalID === -1) return

  const externalIDStart = data.substring(finalID, finalID + 100)
  const finalStart = externalIDStart.substring(
    externalIDStart.startsWith('external') ? 12 : externalIDStart.indexOf('="') + 2
  )

  if (externalIDStart.startsWith('external')) return finalStart.substring(0, finalStart.indexOf('","'))
  if (finalStart.indexOf('=><') >= 0) return finalStart.substring(0, finalStart.indexOf('='))
  if (finalStart.indexOf('"')) return finalStart.substring(0, finalStart.indexOf('"'))

  console.log('idk what happened', finalStart)
  return
}

export async function processYoutubeSubscriptions() {
  const youtubeSubs = await Gamer.database.models.subscription.find({ type: GamerSubscriptionType.YOUTUBE })
  console.log('subs', youtubeSubs, youtubeSubs[0])
  for (const youtubeSub of youtubeSubs) {
    const id = await fetchChannelIDWithName(youtubeSub.username)
    if (!id) continue

    const feed = await fetchRSSFeed(youtubeRSSURL(id))
    if (!feed?.items) continue

    const videos = feed.items
    youtubeSub.subs.forEach(sub => {
      const latestIndex = videos.findIndex(video => video.link && video.link === sub.latestLink)
      const latestVideos = latestIndex > 0 ? videos.slice(0, latestIndex) : latestIndex === 0 ? [] : videos
      console.log(latestIndex, latestVideos)
      latestVideos.reverse().forEach((video, index) => {
        if (!video.link) return
        const text = sub.text || `**${youtubeSub.username}** uploaded a new YouTube video! @everyone`

        sendMessage(sub.channelID, {
          content: `${text} ${video.link}`
          // allowedMentions: { everyone: true, roles: true, users: true }
        })

        if (latestVideos.length - 1 === index) sub.latestLink = video.link
      })
    })

    youtubeSub.save()
  }

  setTimeout(() => processYoutubeSubscriptions(), milliseconds.MINUTE * 1)
}
