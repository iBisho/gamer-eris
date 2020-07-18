import Monitor from '../lib/structures/Monitor'
import { Message, GuildTextableChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'
import { MessageEmbed, userTag } from 'helperis'
import * as confusables from 'confusables'
import getURLs from 'get-urls'
import { sendMessage, deleteMessage } from '../lib/utils/eris'
import constants from '../constants'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    if (!message.guildID || !message.member) return

    const settings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
    // If they have default settings, then no automoderation features will be enabled
    if (!settings) return

    const language = Gamer.getLanguage(message.guildID)

    // This if check allows admins to override and test their filter is working
    if (!message.content.startsWith(`modbypass`)) {
      if (Gamer.helpers.discord.isAdmin(message, settings.staff.adminRoleID)) return
    }

    const embed = new MessageEmbed().setAuthor(
      message.member && message.member.nick ? message.member.nick : message.author.username,
      message.author.avatarURL
    )

    const reasons: string[] = []

    let content = `${message.content}`

    const logEmbed = new MessageEmbed()
      .setAuthor(userTag(message.author), message.author.avatarURL)
      .setTitle(language('moderation/logs:CAP_SPAM'))
      .setThumbnail('https://i.imgur.com/E8IfeWc.png')
      .setDescription(message.content)
      .addField(language('moderation/logs:MESSAGE_ID'), message.id)
      .addField(language('moderation/logs:CHANNEL'), message.channel.mention)
      .setFooter(language('moderation/logs:XP_LOST', { amount: 3 }))
      .setTimestamp(message.timestamp)

    // Run the filter and get back either null or cleaned string
    const capitalSpamCleanup = this.capitalSpamFilter(message, settings)
    // If a cleaned string is returned set the content to the string
    if (capitalSpamCleanup) {
      content = capitalSpamCleanup
      // Remove 3 XP for using capital letters
      Gamer.helpers.levels.removeXP(message.member, 3)
      Gamer.amplitude.push({
        authorID: message.author.id,
        channelID: message.channel.id,
        guildID: message.guildID,
        messageID: message.id,
        timestamp: message.timestamp,
        type: 'CAPITAL_SPAM_DELETED'
      })

      if (settings.moderation.logs.modlogsChannelID)
        sendMessage(settings.moderation.logs.modlogsChannelID, { embed: logEmbed.code })
      reasons.push(language(`common:AUTOMOD_CAPITALS`))
    }

    // Run the filter and get back either null or cleaned string
    const naughtyWordCleanup = this.naughtyWordFilter(content, settings)
    if (naughtyWordCleanup) {
      const naughtyReason = language(`common:AUTOMOD_NAUGHTY`)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const _word of naughtyWordCleanup.naughtyWords) {
        if (!reasons.includes(naughtyReason)) reasons.push(naughtyReason)
        // Remove 5 XP per word used
        Gamer.helpers.levels.removeXP(message.member, 5)
        Gamer.amplitude.push({
          authorID: message.author.id,
          channelID: message.channel.id,
          guildID: message.guildID,
          messageID: message.id,
          timestamp: message.timestamp,
          type: 'PROFANITY_DELETED'
        })
      }

      if (naughtyWordCleanup.naughtyWords.length) {
        logEmbed
          .setFooter(language('moderation/logs:XP_LOST', { amount: 5 * naughtyWordCleanup.naughtyWords.length }))
          .setTitle(language('moderation/logs:PROFANITY', { words: naughtyWordCleanup.naughtyWords.join(', ') }))
        if (settings.moderation.logs.modlogsChannelID)
          sendMessage(settings.moderation.logs.modlogsChannelID, { embed: logEmbed.code })
      }

      // If a cleaned string is returned set the content to the string
      content = naughtyWordCleanup.cleanString
    }

    // Run the filter and get back either null or cleaned string
    const linkFilterCleanup = this.linkFilter(message, content, settings)
    // If a cleaned string is returned set the content to the string
    if (linkFilterCleanup) {
      content = linkFilterCleanup.content

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const _url of linkFilterCleanup.filteredURLs) {
        Gamer.helpers.levels.removeXP(message.member, 5)
        Gamer.amplitude.push({
          authorID: message.author.id,
          channelID: message.channel.id,
          guildID: message.guildID,
          messageID: message.id,
          timestamp: message.timestamp,
          type: 'URLS_DELETED'
        })
      }

      if (linkFilterCleanup.filteredURLs.length) {
        logEmbed
          .setFooter(language('moderation/logs:XP_LOST', { amount: 5 * linkFilterCleanup.filteredURLs.length }))
          .setTitle(language('moderation/logs:LINK_POSTED', { links: linkFilterCleanup.filteredURLs.join(', ') }))
        if (settings.moderation.logs.modlogsChannelID)
          sendMessage(settings.moderation.logs.modlogsChannelID, { embed: logEmbed.code })
      }

      reasons.push(language(`common:AUTOMOD_URLS`))
    }

    if (content === message.content) return

    const botPerms = (message.channel as GuildTextableChannel).permissionsOf(Gamer.user.id)
    // If the message can be deleted, delete it
    if (botPerms.has('manageMessages')) message.delete(language(`common:AUTOMOD_DELETE_REASON`)).catch(() => undefined)
    // Need send and embed perms to send the clean response
    if (!botPerms.has('sendMessages') || !botPerms.has('embedLinks')) return

    embed.setDescription(content)

    if (reasons.length === 1) embed.setFooter(reasons[0]!)
    else embed.setFooter(language(`common:TOO_MUCH_WRONG`))
    // Send back the cleaned message with the author information
    message.channel.createMessage({ embed: embed.code })
    if (reasons.length > 1) {
      const reason = await message.channel.createMessage(`${message.author.mention} ${reasons.join('\n')}`)
      deleteMessage(reason, 3, language('common:CLEAR_SPAM'))
    }
  }

  capitalSpamFilter(message: Message, settings: GuildSettings) {
    if (settings.moderation.filters.capital === 100) return

    let lowercaseCount = 0
    let uppercaseCount = 0
    let characterCount = 0

    for (const letter of message.content) {
      for (const language of [constants.alphabet.english, constants.alphabet.russian]) {
        if (language.lowercase.includes(letter)) lowercaseCount++
        else if (language.uppercase.includes(letter)) uppercaseCount++
      }

      if (letter !== ' ') characterCount++
    }

    const letterCount = lowercaseCount + uppercaseCount
    if (characterCount === 1 || (message.content.split(' ').length < 2 && letterCount <= 10)) return

    const percentageOfCapitals = (uppercaseCount / characterCount) * 100
    if (percentageOfCapitals < settings.moderation.filters.capital) return

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
        const first = textArray[i] || ``
        const second = textArray[i + 1] || ``

        if (first + second === cleanedWord) {
          result.push(`$`.repeat(first.length), `$`.repeat(second.length))
          i += 1
        } else {
          result.push(first)
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
