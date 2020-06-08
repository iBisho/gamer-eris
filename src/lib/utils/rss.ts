import rss from 'rss-parser'

const rssParser = new rss()

export async function fetchRSSFeed(url: string) {
  const feed = await rssParser.parseURL(url).catch(error => console.log(error))
  if (!feed) return

  return feed
}
