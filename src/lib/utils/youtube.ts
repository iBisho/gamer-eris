import Gamer from '../..'
import { GamerSubscriptionType } from '../../database/schemas/subscription'
import nodefetch from 'node-fetch'
import { sendMessage } from './eris'
import { milliseconds } from '../types/enums/time'
import parse5 from 'parse5'

export async function fetchChannelIDWithName(name: string) {
  const data = await nodefetch(`https://www.youtube.com/results?search_query=${name}&sp=EgIQAg%253D%253D`)
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

async function fetchLatestVideos(id: string) {
  const data = await nodefetch(`https://www.youtube.com/channel/${id}/videos`)
    .then(res => res.text())
    .catch(() => undefined)
  if (!data) return []

  const parsed = parse5.parse(data.substring(data.indexOf('<body'), data.indexOf('</body>')))
  const videos: { link: string; title: string }[] = []

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const processNode = node => {
    if (node.nodeName !== 'a') {
      if (Array.isArray(node.childNodes)) {
        for (const n of node.childNodes) processNode(n)
      }
      return
    }

    let link = ''
    let title = ''

    for (const attr of node.attrs) {
      if (attr.name === 'href' && attr.value.startsWith('/watch?v=')) link = attr.value
      if (attr.name === 'title') title = attr.value
      // videos.push({ link: `https://www.youtube.com${attr.value}`, title:  })
    }
    if (link && title) videos.push({ link, title })
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  for (const node of parsed.childNodes) processNode(node)
  return videos
}

export async function processYoutubeSubscriptions() {
  const youtubeSubs = await Gamer.database.models.subscription.find({ type: GamerSubscriptionType.YOUTUBE })

  for (const youtubeSub of youtubeSubs) {
    const id = await fetchChannelIDWithName(youtubeSub.username)
    // if (!id) id = await searchByChannelName()
    const videos = await fetchLatestVideos(id || youtubeSub.username)
    if (!videos) return

    youtubeSub.subs.forEach(sub => {
      const latestIndex = videos.findIndex(video => video.link && video.link === sub.latestLink)
      const latestVideos = latestIndex > 0 ? videos.slice(0, latestIndex) : latestIndex === 0 ? [] : videos

      latestVideos.reverse().forEach((video, index) => {
        if (!video.link) return
        // If there is a filter and the title does not have the filter
        if (sub.game && video.title && !video.title.toLowerCase().includes(sub.game)) return

        const text = sub.text || `**${youtubeSub.username}** uploaded a new YouTube video! @everyone`

        sendMessage(sub.channelID, {
          content: `${text} ${video.link}`,
          allowedMentions: { everyone: true, roles: true, users: true }
        })

        if (latestVideos.length - 1 === index) sub.latestLink = video.link
      })
    })

    youtubeSub.save()
  }

  setTimeout(() => processYoutubeSubscriptions(), milliseconds.MINUTE * 5)
}
