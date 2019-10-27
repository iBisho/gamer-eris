import { User, Guild } from 'eris'
import { GamerEmoji } from '../types/gamer'

const REGEXP = /%AUTHOR%|%AUTHORMENTION%|%USER%|%GUILD%|%USERMENTION%|%USERCOUNT%|%MEMBERCOUNT%|%AUTHORIMAGE%|%USERIMAGE%|%GUILDIMAGE%/gi

export default class {
  variables(string: string, user?: User, guild?: Guild, author?: User, emojis?: GamerEmoji[]) {
    let fullContent = ``

    const lineBreakRegex = / *%LINEBREAK% */gi
    const lineBreakString = string.replace(/\n/g, ` %LINEBREAK% `)

    fullContent = lineBreakString
      .split(` `)
      .map(word => {
        if (!word.startsWith('{') || !word.endsWith(`}`) || !emojis) return word

        const name = word.substring(1, word.length - 1)
        const foundEmoji = emojis.find(e => e.name === name)
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
}
