const embedLimits = {
  title: 256,
  description: 2048,
  fieldName: 256,
  fieldValue: 1024,
  footerText: 2048,
  authorName: 256,
  fields: 25,
  total: 6000
}

export default class GamerEmbed {
  currentTotal = 0
  enforceLimits = true
  file: EmbedFile | undefined

  code: EmbedCode = {
    author: undefined,
    // Set the default color to be the Gamer Blue bright color
    color: 0x41ebf4,
    description: undefined,
    fields: [],
    footer: undefined,
    image: undefined,
    timestamp: undefined,
    title: undefined,
    thumbnail: undefined,
    url: undefined
  }

  constructor(enforceLimits = true) {
    // By default we will always want to enforce discord limits but this option allows us to bypass for whatever reason.
    if (!enforceLimits) this.enforceLimits = false

    return this
  }

  fitData(data: string, max: number) {
    // If the string is bigger then the allowed max shorten it.
    if (data.length > max) data = data.substring(0, max)
    // Check the amount of characters left for this embed
    const availableCharacters = embedLimits.total - this.currentTotal
    // If it is maxed out already return empty string as nothing can be added anymore
    if (!availableCharacters) return ``
    // If the string breaks the maximum embed limit then shorten it.
    if (this.currentTotal + data.length > embedLimits.total) return data.substring(0, availableCharacters)
    // Return the data as is with no changes.
    return data
  }

  setAuthor(name: string, icon?: string, url?: string) {
    const finalName = this.enforceLimits ? this.fitData(name, embedLimits.authorName) : name
    // eslint-disable-next-line @typescript-eslint/camelcase
    this.code.author = { name: finalName, icon_url: icon, url }

    return this
  }

  setColor(color: string) {
    this.code.color =
      color.toLowerCase() === `random`
        ? // Random color
          Math.floor(Math.random() * (0xffffff + 1))
        : // Convert the hex to a acceptable color for discord
          parseInt(color.replace('#', ''), 16)

    return this
  }

  setDescription(description: string) {
    this.code.description = this.fitData(description, embedLimits.description)

    return this
  }

  addField(name: string, value: string | number, inline = false) {
    if (this.code.fields.length >= 25) return this

    this.code.fields.push({
      name: this.fitData(name.toString(), embedLimits.fieldName),
      value: this.fitData(value.toString(), embedLimits.fieldValue),
      inline
    })

    return this
  }

  addBlankField(inline = false) {
    return this.addField('\u200B', '\u200B', inline)
  }

  attachFile(file: Buffer, name: string) {
    this.file = {
      file,
      name
    }

    return this
  }

  setFooter(text: string, icon?: string) {
    // eslint-disable-next-line @typescript-eslint/camelcase
    this.code.footer = { text: this.fitData(text, embedLimits.footerText), icon_url: icon }

    return this
  }

  setImage(url: string) {
    this.code.image = { url }

    return this
  }

  setTimestamp(time: Date | number = new Date()) {
    this.code.timestamp = typeof time === 'number' ? time.toString() : time.getTime().toString()

    return this
  }

  setTitle(title: string, url?: string) {
    this.code.title = this.fitData(title, embedLimits.title)
    if (url) this.code.url = url

    return this
  }

  setThumbnail(url: string) {
    this.code.thumbnail = { url }

    return this
  }
}

export interface EmbedAuthor {
  name: string
  icon_url?: string
  url?: string
}

export interface EmbedField {
  name: string
  value: string
  inline: boolean
}

export interface EmbedFile {
  name: string
  file: Buffer
}

export interface EmbedFooter {
  text: string
  icon_url?: string
}

export interface EmbedImage {
  url: string
}

export interface EmbedCode {
  author: EmbedAuthor | undefined
  // Set the default color to be the Gamer Blue bright color
  color: number
  description: string | undefined
  fields: EmbedField[]
  footer: EmbedFooter | undefined
  image: EmbedImage | undefined
  timestamp: string | undefined
  title: string | undefined
  thumbnail: EmbedImage | undefined
  url: string | undefined
}
