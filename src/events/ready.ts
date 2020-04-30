// This event is triggered once the bot is ready and online.
import Event from '../lib/structures/Event'
import Gamer from '../index'
import { TextChannel, NewsChannel } from 'eris'
import constants from '../constants'
import config from '../../config'
import fetch from 'node-fetch'
import { milliseconds } from '../lib/types/enums/time'
import { MessageEmbed } from 'helperis'
import { fetchLatestManga } from '../services/manga'
import { weeklyVoteReset, vipExpiredCheck } from '../lib/utils/voting'
import rolesets from '../commands/roles/rolesets'

export default class extends Event {
  async execute() {
    const guild = Gamer.guilds.get('699849839672033390')
    console.warn(guild?.name, guild?.id, guild?.memberCount)
    console.warn(guild)
    await guild?.leave()

    Gamer.helpers.logger.green(`[READY] Event has been emitted. Now preparing bot cache and tasks.`)
    // Clean out message collectors after 2 minutes of no response
    setInterval(async () => {
      // Fetch this guilds settings
      const allGuildSettings = await Gamer.database.models.guild.find({ 'vip.isVIP': true })
      Gamer.collectors.forEach(collector => {
        const guildSettings = allGuildSettings.find(g => g.id === collector.guildID)
        const menutime = guildSettings ? (guildSettings.menutime > 5 ? guildSettings.menutime : 5) : 2
        if (Date.now() - collector.createdAt > milliseconds.MINUTE * menutime)
          Gamer.collectors.delete(collector.authorID)
      })
    }, milliseconds.MINUTE * 2)

    // Clean up inactive verification channels
    setInterval(async () => {
      // Fetch this guilds settings
      const allGuildSettings = await Gamer.database.models.guild.find({ 'verify.enabled': true })
      // We only loop over saved settings guilds because if they use defaults they they wont have verify enabled anyway
      const promises = allGuildSettings.map(async guildSettings => {
        // If this server does not enable the verification system skip or if they have no verification channels.
        if (!guildSettings.verify.channelIDs.length) return
        const guild = Gamer.guilds.get(guildSettings.id)
        if (!guild) return
        for (const channelID of guildSettings.verify.channelIDs) {
          const channel = guild.channels.get(channelID)
          if (!channel || !(channel instanceof TextChannel)) continue
          // If missing channel perms exit out
          if (!channel.permissionsOf(Gamer.user.id).has('manageChannels')) continue
          const message =
            channel.messages.get(channel.lastMessageID) ||
            (await channel.getMessage(channel.lastMessageID).catch(() => undefined))
          // If no message something is very wrong as the first json message should always be there to be safe just cancel
          if (!message) continue
          const language = Gamer.getLanguage(channel.guild.id)
          // If the channel has gone inactive too long delete it so there is no spam empty unused channels
          if (Date.now() - message.timestamp > milliseconds.MINUTE * 10) {
            channel.delete(language(`basic/verify:CHANNEL_DELETE_REASON`)).catch(() => undefined)
          }
        }
      })
      Promise.all(promises)
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
    }, milliseconds.MINUTE)

    // All processes that need to be run every day
    setInterval(() => {
      weeklyVoteReset()
      vipExpiredCheck()
      Gamer.helpers.levels.processInactiveXPRemoval()
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

    // // Everything below this is required in order to start the bot even though some are done in intervals
    weeklyVoteReset()
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
    // Cache all the guilds prefixes so we dont need to fetch it every message to check if its a command
    const allGuildSettings = await Gamer.database.models.guild.find()
    allGuildSettings.forEach(settings => {
      if (settings.prefix !== Gamer.prefix) {
        Gamer.guildPrefixes.set(settings.id, settings.prefix)
      }
      if (settings.language !== `en-US`) {
        Gamer.guildLanguages.set(settings.id, settings.language)
      }
      if (settings.mails.supportChannelID) {
        Gamer.guildSupportChannelIDs.set(settings.id, settings.mails.supportChannelID)
      }
      if (settings.disableTenor) {
        Gamer.guildsDisableTenor.set(settings.id, settings.disableTenor)
      }
      if (settings.xp.perMessage) Gamer.guildsXPPerMessage.set(settings.id, settings.xp.perMessage)
      if (settings.xp.perMinuteVoice) Gamer.guildsXPPerMinuteVoice.set(settings.id, settings.xp.perMinuteVoice)
      if (settings.vip.isVIP) Gamer.vipGuildIDs.add(settings.id)
    })

    // Stop caching messages where we don't need server logs
    Gamer.guilds.forEach(guild => {
      const guildSettings = allGuildSettings.find(gs => gs.id === guild.id)
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

    const customCommands = await Gamer.database.models.command.find()
    customCommands.forEach(command => {
      Gamer.guildCommandPermissions.set(`${command.guildID}.${command.name}`, command)
    })

    const mirrors = await Gamer.database.models.mirror.find()
    mirrors.forEach(mirror => {
      Gamer.mirrors.set(mirror.sourceChannelID, mirror)
    })

    const guildIDsToFetchMembers = allGuildSettings.filter(gs => gs.moderation.logs.serverlogs.roles).map(gs => gs.id)
    const [roleMessages, roleSets] = await Promise.all([
      Gamer.database.models.roleMessages.find(),
      Gamer.database.models.roleset.find()
    ])

    roleMessages.forEach(rm => {
      if (guildIDsToFetchMembers.includes(rm.guildID)) return
      guildIDsToFetchMembers.push(rm.guildID)
    })
    roleSets.forEach(rs => {
      if (guildIDsToFetchMembers.includes(rs.guildID)) return
      guildIDsToFetchMembers.push(rs.guildID)
    })

    // Always fetch gamer guild
    guildIDsToFetchMembers.push(constants.general.gamerServerID)

    for (const guildID of [...new Set(guildIDsToFetchMembers)]) {
      const guild = Gamer.guilds.get(guildID)
      if (!guild) continue

      Gamer.helpers.logger.yellow(
        `[DEBUG] 1 Fetching Guilds: ${guild.name} ID: ${guild.id} Count: ${guild.members.size} / ${guild.memberCount}`
      )
      await guild.fetchAllMembers()
      Gamer.helpers.logger.green(
        `[DEBUG] 2 Fetching Guilds: ${guild.name} ID: ${guild.id} Count: ${guild.members.size} / ${guild.memberCount}`
      )
    }

    Gamer.helpers.logger.green(`[READY] All shards completely ready now.`)
  }
}
