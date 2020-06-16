// This event is triggered once the bot is ready and online.
import Gamer from '../index'
import { TextChannel, NewsChannel } from 'eris'
import constants from '../constants'
import config from '../../config'
import fetch from 'node-fetch'
import { milliseconds } from '../lib/types/enums/time'
import { MessageEmbed } from 'helperis'
import { fetchLatestManga } from '../services/manga'
import { weeklyVoteReset } from '../lib/utils/voting'
import { dailyLifeTasksReset } from '../lib/utils/marriage'
import { EventListener } from 'yuuko'
import { processPolls } from '../lib/utils/poll'
import { processYoutubeSubscriptions } from '../lib/utils/youtube'
import { processRedditSubscriptions } from '../lib/utils/reddit'

export default new EventListener('ready', async () => {
  Gamer.helpers.logger.green(`[READY] Event has been emitted. Now preparing bot cache and tasks.`)

  if (Gamer.user.id === constants.general.gamerID) {
    const embed = new MessageEmbed()
      .setColor(`#1abc9c`)
      .setTitle(`Connected to the Gateway`)
      .setDescription(`All shards are connected. The ready event has been emitted.`)
      .setTimestamp()
    Gamer.createMessage(`680852595061162014`, { embed: embed.code })

    Gamer.createMessage(`578624588552994840`, 'The bot is now online and ready. Preparing the bot cache and tasks now.')
  }
  setInterval(async () => {
    // Clean out message collectors after 2 minutes of no response
    Gamer.helpers.discord.processMessageCollectors()
    // Clean up inactive verification channels
    Gamer.helpers.moderation.processVerificationChannels()
  }, milliseconds.MINUTE * 2)

  // Randomly select 3 new missions every 30 minutes
  setInterval(async () => {
    // Remove all missions first before creating any new missions
    await Gamer.database.models.mission.deleteMany({})
    Gamer.missionsStartTimestamp = Date.now()
    // Find 3 new random missions to use for today
    Gamer.missions = []
    while (Gamer.missions.length < 5) {
      const randomMission = constants.missions[Math.floor(Math.random() * (constants.missions.length - 1))]
      if (!Gamer.missions.find(m => m.title === randomMission.title)) {
        Gamer.missions.push(randomMission)
      }
    }
  }, milliseconds.MINUTE * 30)

  // Create product analytics for the bot
  setInterval(() => {
    // Rate limit is 100 batches of 10 events per second
    for (let i = 0; i < 100; i++) {
      if (!Gamer.amplitude.length) break
      fetch(config.apiKeys.amplitude.url, {
        method: `POST`,
        headers: { 'Content-Type': `application/json`, Accept: '*/*' },
        body: JSON.stringify({
          // eslint-disable-next-line @typescript-eslint/camelcase
          api_key: config.apiKeys.amplitude.key,
          // Splice will return the deleted items from the array
          events: Gamer.amplitude.splice(0, 10).map(data => ({
            // eslint-disable-next-line @typescript-eslint/camelcase
            event_properties: data,
            // eslint-disable-next-line @typescript-eslint/camelcase
            user_id: data.authorID,
            // eslint-disable-next-line @typescript-eslint/camelcase
            event_type: data.type
          }))
        })
      }).catch(() => undefined)
    }
  }, milliseconds.SECOND)

  // All processes that need to be run every minute
  setInterval(() => {
    Gamer.helpers.events.process()
    Gamer.helpers.events.processReminders()
    Gamer.helpers.moderation.processMutes()
    processPolls()
  }, milliseconds.MINUTE)

  // All processes that need to be run every day
  setInterval(() => {
    weeklyVoteReset()
    Gamer.helpers.levels.processInactiveXPRemoval()
    dailyLifeTasksReset()
  }, milliseconds.DAY)

  // Begin fetching manga
  setInterval(() => fetchLatestManga(), milliseconds.MINUTE * 30)
  // Run the Trading Card Interval every 20 minutes
  setInterval(async () => {
    const cardSettings = await Gamer.database.models.tradingCard.find()
    const embed = new MessageEmbed()
    for (const setting of cardSettings) {
      const gameName = setting.game.toLowerCase()
      const cards =
        gameName === `arenaofvalor`
          ? constants.cards.arenaofvalor
          : gameName === `mobilelegends`
          ? constants.cards.mobilelegends
          : gameName === `rulesofsurvival`
          ? constants.cards.rulesofsurvival
          : gameName === `baseball`
          ? constants.cards.baseball
          : []
      const guild = Gamer.guilds.get(setting.guildID)
      if (!guild) continue
      const channel = guild.channels.get(setting.channelID)
      if (!channel || !(channel instanceof TextChannel)) continue
      const botPerms = channel.permissionsOf(Gamer.user.id)
      if (!botPerms.has(`readMessages`) || !botPerms.has(`sendMessages`) || !botPerms.has(`embedLinks`)) {
        continue
      }
      const randomCard = cards[Math.floor(Math.random() * cards.length)]
      const language = Gamer.getLanguage(guild.id)
      if (!language) continue
      setting.lastItemName = randomCard.name
      setting.save()
      embed
        .setAuthor(language(`gaming/capture:GUESS`), Gamer.user.avatarURL)
        .setTitle(language(`gaming/capture:TITLE`, { prefix: Gamer.guildPrefixes.get(guild.id) || Gamer.prefix }))
        .setImage(randomCard.image)
        .setFooter(`Add this game to your server to capture more cards with the invite command.`)
      channel.createMessage({ embed: embed.code })
    }
  }, milliseconds.MINUTE * 20)

  // Clears out any user who is past the slowmode of 2 seconds
  setInterval(() => {
    if (!Gamer.slowmode.size) return
    const now = Date.now()
    Gamer.slowmode.forEach((timestamp, userID) => {
      if (now - timestamp > 2000) Gamer.slowmode.delete(userID)
    })
  }, milliseconds.SECOND)

  // Clears all cooldowns every 5 seconds
  setInterval(() => {
    const now = Date.now()
    for (const [id, timestamp] of Gamer.cooldowns.entries()) {
      if (now < timestamp) continue
      // Remove the cooldown as the time has passed
      Gamer.cooldowns.delete(id)
    }
  }, milliseconds.SECOND * 5)

  weeklyVoteReset()
  processYoutubeSubscriptions()
  processRedditSubscriptions()

  Gamer.helpers.logger.green(`Loading all tags into cache now...`)
  // Set the tags in cache
  const tags = await Gamer.database.models.tag.find()
  for (const tag of tags) Gamer.tags.set(`${tag.guildID}.${tag.name}`, tag)
  Gamer.helpers.logger.green(`Preparing all missions into cache now...`)
  // Set the missions on startup
  // Remove all missions first before creating any new missions
  await Gamer.database.models.mission.deleteMany({}).catch(error => console.log(error))
  // Always add the first mission on bootup to encourage users to add gamer to more servers
  Gamer.missions.push(constants.missions[0])
  // Add 2 more unique missions
  while (Gamer.missions.length < 5) {
    const randomMission = constants.missions[Math.floor(Math.random() * constants.missions.length)]
    if (!Gamer.missions.find(m => m.title === randomMission.title)) {
      Gamer.missions.push(randomMission)
    }
  }
  Gamer.helpers.logger.green(`Preparing all cached settings like prefix, languages etc into cache now...`)
  Gamer.helpers.logger.green(`Preparing cached guild settings`)
  // Cache all the guilds prefixes so we dont need to fetch it every message to check if its a command
  const allGuildSettings = await Gamer.database.models.guild.find()
  allGuildSettings.forEach(settings => {
    if (settings.prefix !== Gamer.prefix) {
      Gamer.guildPrefixes.set(settings.guildID, settings.prefix)
    }
    if (settings.language !== `en-US`) {
      Gamer.guildLanguages.set(settings.guildID, settings.language)
    }
    if (settings.mails.supportChannelID) {
      Gamer.guildSupportChannelIDs.set(settings.guildID, settings.mails.supportChannelID)
    }
    if (settings.disableTenor) {
      Gamer.guildsDisableTenor.set(settings.guildID, settings.disableTenor)
    }
    if (settings.xp.perMessage) Gamer.guildsXPPerMessage.set(settings.guildID, settings.xp.perMessage)
    if (settings.xp.perMinuteVoice) Gamer.guildsXPPerMinuteVoice.set(settings.guildID, settings.xp.perMinuteVoice)
    if (settings.vip.isVIP) Gamer.vipGuildIDs.add(settings.guildID)
  })

  // Stop caching messages where we don't need server logs
  Gamer.guilds.forEach(guild => {
    const guildSettings = allGuildSettings.find(gs => gs.guildID === guild.id)
    if (
      guildSettings?.moderation.logs.serverlogs.messages.channelID &&
      guild.channels.has(guildSettings.moderation.logs.serverlogs.messages.channelID)
    )
      return
    guild.channels.forEach(channel => {
      if (!(channel instanceof TextChannel) && !(channel instanceof NewsChannel)) return
      channel.messages.limit = 0
    })
  })

  Gamer.helpers.logger.green(`Preparing all custom command cache settings`)
  const customCommands = await Gamer.database.models.command.find()
  customCommands.forEach(command => {
    Gamer.guildCommandPermissions.set(`${command.guildID}.${command.name}`, command)
  })

  Gamer.helpers.logger.green(`Preparing all cached mirror settings.`)
  const mirrors = await Gamer.database.models.mirror.find()
  mirrors.forEach(mirror => {
    Gamer.mirrors.set(mirror.sourceChannelID, mirror)
  })

  Gamer.helpers.logger.green(`Preparing all spy records.`)
  const spyRecords = await Gamer.database.models.spy.find()
  spyRecords.forEach(record => {
    record.words.forEach(word => {
      const details = Gamer.spyRecords.get(word.toLowerCase())
      if (details) {
        details.push(record.memberID)
      } else {
        Gamer.spyRecords.set(word, [record.memberID])
      }
    })
  })

  Gamer.helpers.logger.green(`[READY] All shards completely ready now.`)
})
