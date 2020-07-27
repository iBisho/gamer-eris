import fetch from 'node-fetch'
import parse5 from 'parse5'
import Gamer from '../..'

interface MangaAttribute {
  name: string
  value: string
}

interface MangaChildNode {
  nodeName: string
  tagName: string
  attrs: MangaAttribute[]
  childNodes: MangaChildNode[]
  parentNode: MangaChildNode
}
export interface MangaAlertData {
  url: string
  text: string
}

export const fetchLatestManga = async () => {
  const data = await fetch('https://fanfox.net/releases')
    .then(res => res.text())
    .catch(() => undefined)
  if (!data) return

  const parsed = parse5.parse(data.substring(data.indexOf('<body'), data.indexOf('</body>')))

  const checkNode = async (node: MangaChildNode) => {
    if (
      ['a', 'img'].includes(node.nodeName) &&
      node.attrs.some((att: MangaAttribute) => att.name === 'class' && att.value.startsWith('manga-list'))
    ) {
      const alt = node.attrs.find((attr: MangaAttribute) => attr.name === 'alt')
      if (!alt) return

      const mangaName = alt.value
      const src = node.attrs.find((attr: MangaAttribute) => attr.name === 'src')
      if (!src) return

      const imageURL = src.value

      const unorderedList = node.parentNode.parentNode.childNodes.find(li => li.nodeName === 'ul')
      if (!unorderedList) return

      const list = unorderedList.childNodes
        .map(li => {
          if (li.nodeName !== 'li') return

          const anchor = li.childNodes.find(n => n.nodeName === 'a')
          if (!anchor) return

          const href = anchor.attrs.find(attr => attr.name === 'href')
          if (!href) return

          const children = anchor.childNodes
          const text = children.find(c => c.nodeName === '#text')
          if (!text) return

          return {
            url: `http://fanfox.net/${href.value}`,
            // @ts-ignore
            text: text.value
          }
        })
        // Remove invalid ones
        .filter(li => li)

      if (!list.length) return

      const subscription = await Gamer.database.models.manga.findOne({ title: mangaName.toLowerCase() })
      if (!subscription) return

      Gamer.emit('mangaAlert', subscription, mangaName, imageURL, list)
    } else {
      if (node.childNodes) node.childNodes.forEach(n => checkNode(n))
    }
  }

  // @ts-ignore
  const allNodes = parsed.childNodes as MangaChildNode[]

  allNodes.forEach(node => checkNode(node))
}

export const isValidManga = async (name: string) => {
  const data = await fetch(`https://fanfox.net/manga/${name.split(' ').join('_')}`)
    .then(res => res.text())
    .catch(() => undefined)
  if (!data) return { valid: false, imageURL: '' }

  const isValid = data.includes('Read Now')

  const body = data.substring(data.indexOf('<body'), data.indexOf('</body>'))
  const start = body.substring(body.indexOf('detail-info-cover-img'))
  const imageURL = start.substring(28, start.indexOf('" alt="'))

  return { valid: isValid, imageURL }
}
