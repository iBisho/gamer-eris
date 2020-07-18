import { User, Guild } from 'eris'
import { GamerEmoji } from '../types/database'
import { milliseconds } from '../types/enums/time'
import GamerClient from '../structures/GamerClient'
import { TenorGif } from '../types/tenor'
import nodefetch from 'node-fetch'

const REGEXP = /%AUTHOR%|%AUTHORMENTION%|%USER%|%GUILD%|%USERMENTION%|%USERCOUNT%|%MEMBERCOUNT%|%AUTHORIMAGE%|%USERIMAGE%|%GUILDIMAGE%/gi

export default class {
  Gamer: GamerClient
  constructor(client: GamerClient) {
    this.Gamer = client
  }

  async variables(string: string, user?: User, guild?: Guild, author?: User, emojis?: GamerEmoji[]) {
    let fullContent = ``

    const lineBreakRegex = / *%LINEBREAK% */gi
    const lineBreakString = string.replace(/\n/g, ` %LINEBREAK% `)

    const promises = lineBreakString.split(` `).map(async word => {
      // User wants a random gif
      if (word.toUpperCase().startsWith('%RANDOM')) {
        const search = word.substring(7, word.length - 1)
        const res = await nodefetch(
          `https://api.tenor.com/v1/search?q=${search === '%' ? 'random' : search}&key=LIVDSRZULELA&limit=50`
        )
          .then(res => res.json())
          .catch(() => undefined)
        if (!res) return word

        if (!res.results.length) return word
        const randomResult = this.Gamer.helpers.utils.chooseRandom((res as TenorGif).results || [])
        const [media] = randomResult.media

        return media?.gif.url
      }

      // User wants to use an emoji
      if (!word.startsWith('{') || !word.endsWith(`}`) || !emojis) return word

      const name = word.substring(1, word.length - 1)
      const foundEmoji = emojis.find(e => e.name === name.toLowerCase())
      if (!foundEmoji) return word

      return foundEmoji.fullCode
    })

    const res = await Promise.all(promises)
    fullContent = res.join(` `)

    fullContent = fullContent.replace(lineBreakRegex, `\n`)

    return fullContent.replace(REGEXP, match => {
      switch (match.toUpperCase()) {
        case `%AUTHOR%`:
          return author ? author.username : ``
        case `%AUTHORMENTION%`:
          return author ? author.mention : ``
        case `%USER%`:
          return user ? user.username : ``
        case `%USERTAG%`:
          return user ? `${user.username}${user.discriminator}` : ``
        case `%USERID%`:
          return user ? user.id : ``
        case `%GUILD%`:
          return guild ? guild.name : ``
        case `%USERCOUNT%`:
        case `%MEMBERCOUNT%`:
          return guild ? guild.memberCount.toString() : ``
        case `%USERMENTION%`:
          return user ? user.mention : ``
        case `%AUTHORIMAGE%`:
          return author ? author.avatarURL : ``
        case `%USERIMAGE%`:
          return user ? user.avatarURL : ``
        case `%GUILDIMAGE%`:
          return guild && guild.iconURL ? guild.iconURL : ``
        default:
          return match
      }
    })
  }

  splitCamelCase(text: string) {
    return text
      .replace(/([A-Z][a-z]|[A-Z]+(?=[A-Z]|$))/g, ' $1')
      .replace(/./, m => m.toUpperCase())
      .trim()
  }

  toTitleCase(text: string) {
    return text
      .split(` `)
      .map(word => `${word[0]!.toUpperCase()}${word.substring(1)}`)
      .join(` `)
  }

  humanizeMilliseconds(value: number) {
    // Gets ms into seconds
    const time = value / 1000

    const days = Math.floor(time / 86400)
    const hours = Math.floor((time % 86400) / 3600)
    const minutes = Math.floor(((time % 86400) % 3600) / 60)
    const seconds = Math.floor(((time % 86400) % 3600) % 60)

    const dayString = days ? `${days}d ` : ''
    const hourString = hours ? `${hours}h ` : ''
    const minuteString = minutes ? `${minutes}m ` : ''
    const secondString = seconds ? `${seconds}s ` : ''

    return `${dayString}${hourString}${minuteString}${secondString}`
  }

  stringToMilliseconds(text: string) {
    const matches = text.match(/(\d+[w|d|h|m]{1})/g)
    if (!matches) return

    let total = 0

    for (const match of matches) {
      // Finds the first of these letters
      const validMatch = /(w|d|h|m|s)/.exec(match)
      // if none of them were found cancel
      if (!validMatch) return
      // Get the number which should be before the index of that match
      const number = match.substring(0, validMatch.index)
      // Get the letter that was found
      const [letter] = validMatch
      if (!number || !letter) return

      let multiplier = milliseconds.SECOND
      switch (letter.toLowerCase()) {
        case `w`:
          multiplier = milliseconds.WEEK
          break
        case `d`:
          multiplier = milliseconds.DAY
          break
        case `h`:
          multiplier = milliseconds.HOUR
          break
        case `m`:
          multiplier = milliseconds.MINUTE
          break
      }

      const amount = number ? parseInt(number, 10) : undefined
      if (!amount) return

      total += amount * multiplier
    }

    return total
  }
}
