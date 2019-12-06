import Monitor from '../lib/structures/Monitor'
import { Message, PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'
import GamerEmbed from '../lib/structures/GamerEmbed'
import * as confusables from 'confusables'
import getURLs from 'get-urls'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

    const settings = await Gamer.database.models.guild.findOne({
      id: message.channel.guild.id
    })
    // If they have default settings, then no automoderation features will be enabled
    if (!settings) return

    const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
    if (!language) return

    // This if check allows admins to override and test their filter is working
    if (!message.content.startsWith(`modbypass`)) {
      if (Gamer.helpers.discord.isAdmin(message, settings.staff.adminRoleID)) return
    }

    const embed = new GamerEmbed().setAuthor(
      message.member && message.member.nick ? message.member.nick : message.author.username,
      message.author.avatarURL
    )

    const reasons: string[] = []

    let content = `${message.content}`

    // Run the filter and get back either null or cleaned string
    const capitalSpamCleanup = this.capitalSpamFilter(message, settings)
    // If a cleaned string is returned set the content to the string
    if (capitalSpamCleanup) {
      content = capitalSpamCleanup
      // Remove 3 XP for using capital letters
      Gamer.helpers.logger.green(
        `Deleted a Capital Spam message on ${message.channel.guild.name} server in ${message.channel.name} channel by ${message.author.username}`
      )
      Gamer.helpers.levels.removeXP(message.member, 3)
      Gamer.amplitude.push({
        authorID: message.author.id,
        channelID: message.channel.id,
        guildID: message.channel.guild.id,
        messageID: message.id,
        timestamp: message.timestamp,
        type: 'CAPITAL_SPAM_DELETED'
      })
      reasons.push(language(`common:AUTOMOD_CAPITALS`))
    }

    // Run the filter and get back either null or cleaned string
    const naughtyWordCleanup = this.naughtyWordFilter(content, settings)
    if (naughtyWordCleanup) {
      const naughtyReason = language(`common:AUTOMOD_NAUGHTY`)
      for (const word of naughtyWordCleanup.naughtyWords) {
        if (!reasons.includes(naughtyReason)) reasons.push(naughtyReason)
        // Log each cleaned word
        Gamer.helpers.logger.green(
          `Deleted [${word}] naughty word on ${message.channel.guild.name} server in ${message.channel.name} channel by ${message.author.username}`
        )
        // Remove 5 XP per word used
        Gamer.helpers.levels.removeXP(message.member, 5)
        Gamer.amplitude.push({
          authorID: message.author.id,
          channelID: message.channel.id,
          guildID: message.channel.guild.id,
          messageID: message.id,
          timestamp: message.timestamp,
          type: 'PROFANITY_DELETED'
        })
      }

      // If a cleaned string is returned set the content to the string
      content = naughtyWordCleanup.cleanString
    }

    // Run the filter and get back either null or cleaned string
    const linkFilterCleanup = this.linkFilter(message, content, settings)
    // If a cleaned string is returned set the content to the string
    if (linkFilterCleanup) {
      content = linkFilterCleanup.content

      for (const url of linkFilterCleanup.filteredURLs) {
        Gamer.helpers.logger.green(
          `Deleted a blacklisted URL ${url} on ${message.channel.guild.name} server in ${message.channel.name} channel by ${message.author.username}`
        )
        Gamer.helpers.levels.removeXP(message.member, 5)
        Gamer.amplitude.push({
          authorID: message.author.id,
          channelID: message.channel.id,
          guildID: message.channel.guild.id,
          messageID: message.id,
          timestamp: message.timestamp,
          type: 'URLS_DELETED'
        })
      }
      reasons.push(language(`common:AUTOMOD_URLS`))
    }

    if (content === message.content) return

    const botPerms = message.channel.permissionsOf(Gamer.user.id)
    // If the message can be deleted, delete it
    if (botPerms.has('manageMessages')) message.delete(language(`common:AUTOMOD_DELETE_REASON`)).catch(() => null)
    // Need send and embed perms to send the clean response
    if (!botPerms.has('sendMessages') || !botPerms.has('embedLinks')) return

    embed.setDescription(content)

    if (reasons.length === 1) embed.setFooter(reasons[0])
    else embed.setFooter(language(`common:TOO_MUCH_WRONG`))
    // Send back the cleaned message with the author information
    message.channel.createMessage({ embed: embed.code })
    if (reasons.length > 1) {
      const reason = await message.channel.createMessage(`${message.author.mention} ${reasons.join('\n')}`)
      setTimeout(() => reason.delete().catch(() => null), 3000)
    }
  }

  capitalSpamFilter(message: Message, settings: GuildSettings) {
    if (settings.moderation.filters.capital === 100) return

    const messageWithoutSpaces = message.content.replace(/[^A-Za-z]/g, ``)
    const finalLength = messageWithoutSpaces.length
    if (finalLength === 1 || (message.content.split(` `).length < 2 && finalLength <= 10)) return

    // Removes all non-capitals and checks how many left
    const count = message.content.replace(/[^A-Z]/g, '').length
    const percentageOfCapitals = (count / finalLength) * 100
    // If image is sent it isNaN
    if (isNaN(percentageOfCapitals) || percentageOfCapitals < settings.moderation.filters.capital) return

    // If there was too many capitals then lower it
    return message.content.toLowerCase()
  }

  naughtyWordFilter(content: string, settings: GuildSettings) {
    // If status is disabled or no words then cancel
    if (
      !settings.moderation.filters.profanity.enabled ||
      (!settings.moderation.filters.profanity.words.length && !settings.moderation.filters.profanity.strictWords.length)
    )
      return
    // Create an array of words from the message

    const naughtyWords = []
    const cleanString = []
    // Cleans up the string of non english characters and makes them into english characters so we can run checks on them
    let finalString = confusables.remove(content)

    // Replace all instance of a strict word
    for (const word of settings.moderation.filters.profanity.strictWords) {
      const cleanedWord = confusables.remove(word)

      if (!finalString.includes(cleanedWord)) continue
      naughtyWords.push(word)
      // All the instances of this naughty word must be replaced with $. Need 2 $ because $ is a special character in regexes
      finalString = finalString.replace(new RegExp(cleanedWord, `gi`), `$$`.repeat(word.length))

      // Since the finalstring was first modified from confusables we need to bring back the original content version
      const finalStringArray = finalString.split(``)
      finalString = content
        .split(``)
        .map((letter, index) => (finalStringArray[index] === `$` ? `$` : letter))
        .join(``)
      // Check for any outliers for example a bad word split with a space
      const textArray = finalString.split(` `)

      const result = []
      for (let i = 0; i < textArray.length; i++) {
        const first = textArray[i]
        const second = textArray[i + 1] || ``

        if (first + second === cleanedWord) {
          result.push(`$`.repeat(first.length), `$`.repeat(second.length))
          i += 1
        } else {
          result.push(textArray[i])
        }
      }

      if (finalString !== result.join(` `).trim()) finalString = result.join(` `)
    }

    // Since the finalstring was first modified from confusables we need to bring back the original content version
    finalString = content
      .split(``)
      .map((letter, index) => (finalString[index] === `$` ? `$` : letter))
      .join(``)

    for (const word of finalString.split(` `)) {
      const cleanedWord = confusables.remove(word)

      if (settings.moderation.filters.profanity.words.includes(cleanedWord.toLowerCase())) {
        naughtyWords.push(word)
        cleanString.push(`$`.repeat(word.length))
      } else {
        cleanString.push(word)
      }
    }

    return { naughtyWords, cleanString: cleanString.join(` `) }
  }

  linkFilter(message: Message, content: string, settings: GuildSettings) {
    if (!settings.moderation.filters.url.enabled) return

    // Check if this role/channel/user is whitelisted
    for (const channelID of settings.moderation.filters.url.channelIDs) if (message.channel.id === channelID) return
    for (const userID of settings.moderation.filters.url.userIDs) if (message.author.id === userID) return
    for (const roleID of settings.moderation.filters.url.roleIDs)
      if (message.member && message.member.roles.includes(roleID)) return

    const urlsFound = getURLs(content, { requireSchemeOrWww: false })
    if (!urlsFound.size) return

    const filteredURLs = []
    for (const url of urlsFound) {
      let allowedURL = false
      for (const wURL of settings.moderation.filters.url.urls) if (url.startsWith(wURL)) allowedURL = true
      if (allowedURL) continue
      filteredURLs.push(url)
      content = content.replace(new RegExp(url, `gi`), `#`.repeat(url.length))
    }

    return { content, filteredURLs }
  }
}
