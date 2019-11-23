import { User, Guild } from 'eris'
import { GamerEmoji } from '../types/database'
import { milliseconds } from '../types/enums/time'
import GamerClient from '../structures/GamerClient'

const REGEXP = /%AUTHOR%|%AUTHORMENTION%|%USER%|%GUILD%|%USERMENTION%|%USERCOUNT%|%MEMBERCOUNT%|%AUTHORIMAGE%|%USERIMAGE%|%GUILDIMAGE%/gi

export default class {
  Gamer: GamerClient
  constructor(client: GamerClient) {
    this.Gamer = client
  }

  variables(string: string, user?: User, guild?: Guild, author?: User, emojis?: GamerEmoji[]) {
    let fullContent = ``

    const lineBreakRegex = / *%LINEBREAK% */gi
    const lineBreakString = string.replace(/\n/g, ` %LINEBREAK% `)

    fullContent = lineBreakString
      .split(` `)
      .map(word => {
        if (!word.startsWith('{') || !word.endsWith(`}`) || !emojis) return word

        const name = word.substring(1, word.length - 1)
        const foundEmoji = emojis.find(e => e.name === name.toLowerCase())
        if (!foundEmoji) return word

        return foundEmoji.fullCode
      })
      .join(` `)

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
      .map(word => `${word[0].toUpperCase()}${word.substring(1)}`)
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
    // Finds the first of these letters
    const match = /(w|d|h|m|s)/.exec(text)
    // if none of them were found cancel
    if (!match) return
    // Get the number which should be before the index of that match
    const number = text.substring(0, match.index)
    // Get the letter that was found
    const [letter] = match
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

    const amount = parseInt(number, 10)
    if (!parseInt) return

    return amount * multiplier
  }

  // async stringToEmbed(text: string) {
  //   // If this throws then handle it where the function is called to show error to user of why their json failed
  //   const json = JSON.parse(text) as EmbedBase

  //   const embed = new GamerEmbed()
  //   if (json.timestamp) embed.setTimestamp()
  //   if (json.description) embed.setDescription(json.description)
  //   if (json.title) embed.setTitle(json.title)

  //   if (json.author && json.author.name) embed.setAuthor(json.author.name, json.author.icon_url, json.author.url)

  //   if (json.footer && json.footer.text) embed.setFooter(json.footer.text, json.footer.icon_url)

  //   if (json.fields) for (const field of json.fields) embed.addField(field.name, field.value, field.inline)

  //   return embed
  // }
}
