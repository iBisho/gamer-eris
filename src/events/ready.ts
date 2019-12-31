// This event is triggered once the bot is ready and online.
import Event from '../lib/structures/Event'
import Gamer from '../index'
import { GuildSettings, MemberSettings } from '../lib/types/settings'
import { TextChannel } from 'eris'
import constants from '../constants'
import config from '../../config'
import fetch from 'node-fetch'
import { milliseconds } from '../lib/types/enums/time'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default class extends Event {
  async execute() {
    // Clean out message collectors after 2 minutes of no response
    setInterval(async () => {
      // Fetch this guilds settings
      const allGuildSettings = (await Gamer.database.models.guild.find()) as GuildSettings[]

      const promises = [...Gamer.collectors.values()].map(async collector => {
        const guildSettings = allGuildSettings.find(g => g.id === collector.guildID)
        // How many minutes to wait for a response for the collectors in this guild. VIP Guilds can change the time
        const menutime = guildSettings ? guildSettings.menutime : 2
        // If the collector had no response in X minutes delete the collector
        if (Date.now() - collector.createdAt > 60000 * menutime) Gamer.collectors.delete(collector.authorID)
      })

      Promise.all(promises)
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
            (await channel.getMessage(channel.lastMessageID).catch(() => null))
          // If no message something is very wrong as the first json message should always be there to be safe just cancel
          if (!message) continue

          const language = Gamer.i18n.get(Gamer.guildLanguages.get(channel.guild.id) || `en-US`)
          if (!language) continue

          // If the channel has gone inactive too long delete it so there is no spam empty unused channels
          if (Date.now() - message.timestamp > milliseconds.MINUTE * 10)
            channel.delete(language(`basic/verify:CHANNEL_DELETE_REASON`))
        }
      })

      Promise.all(promises)
    }, 2000)

    // Randomly select 3 new missions every 30 minutes
    setInterval(() => {
      // Remove all missions first before creating any new missions
      Gamer.database.models.mission.deleteMany({})
      Gamer.missionsStartTimestamp = Date.now()
      // Find 3 new random missions to use for today
      Gamer.missions = []

      while (Gamer.missions.length < 3) {
        const randomMission = constants.missions[Math.floor(Math.random() * (constants.missions.length - 1))]
        if (!Gamer.missions.find(m => m.title === randomMission.title)) Gamer.missions.push(randomMission)
      }
    }, milliseconds.MINUTE * 30)

    // Checks if a member is inactive to begin losing XP every day
    setInterval(async () => {
      // Fetch all guilds from db as anything with default settings wont need to be checked
      const allGuildSettings = (await Gamer.database.models.guild.find()) as GuildSettings[]

      for (const guildSettings of allGuildSettings) {
        // If the inactive days allowed has not been enabled then skip
        if (!guildSettings.xp.inactiveDaysAllowed) continue

        const guild = Gamer.guilds.get(guildSettings.id)
        if (!guild) continue

        const language = Gamer.i18n.get(Gamer.guildLanguages.get(guild.id) || `en-US`)
        if (!language) continue

        // Get all members from the database as anyone with default settings dont need to be checked
        const allMemberSettings = (await Gamer.database.models.member.find()) as MemberSettings[]

        for (const memberSettings of allMemberSettings) {
          // If they have never been updated skip. Or if their XP is below 100 the minimum threshold
          if (!memberSettings.leveling.lastUpdatedAt || memberSettings.leveling.xp < 100) continue
          // Get the member object
          const member = guild?.members.get(memberSettings.memberID)
          if (!member) continue

          // Calculate how many days it has been since this user was last updated
          const daysSinceLastUpdated = (Date.now() - memberSettings.leveling.lastUpdatedAt) / 1000 / 60 / 60 / 24
          if (daysSinceLastUpdated < guildSettings.xp.inactiveDaysAllowed) continue

          // Remove 1% of XP from the user for being inactive today.
          await Gamer.helpers.levels.removeXP(member, Math.floor(memberSettings.leveling.xp * 0.01))
        }
      }
    }, milliseconds.DAY)

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
            events: Gamer.amplitude
              .splice(0, 10)
              // eslint-disable-next-line @typescript-eslint/camelcase
              .map(data => ({ ...data, user_id: data.authorID, event_type: data.type }))
          })
        })
      }
    }, milliseconds.SECOND)

    // Process all gamer events once per minute
    setInterval(() => Gamer.helpers.events.process(), milliseconds.MINUTE)

    // Process all mutes
    setInterval(() => Gamer.helpers.moderation.processMutes(), milliseconds.MINUTE)

    // Run the Trading Card Interval every 20 minutes
    setInterval(async () => {
      const cardSettings = await Gamer.database.models.tradingCard.find()
      const embed = new GamerEmbed()

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
        if (!botPerms.has(`readMessages`) || !botPerms.has(`sendMessages`) || !botPerms.has(`embedLinks`)) continue

        const randomCard = cards[Math.floor(Math.random() * cards.length)]

        const language = Gamer.i18n.get(Gamer.guildLanguages.get(guild.id) || `en-US`)
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

    Gamer.helpers.logger.green(`Loading all tags into cache now...`)
    // Set the tags in cache
    const tags = await Gamer.database.models.tag.find()
    for (const tag of tags) Gamer.tags.set(`${tag.guildID}.${tag.name}`, tag)

    Gamer.helpers.logger.green(`Preparing all missions into cache now...`)
    // Set the missions on startup
    // Remove all missions first before creating any new missions
    await Gamer.database.models.mission.deleteMany({}).catch(error => console.log(error))
    while (Gamer.missions.length < 3) {
      const randomMission = constants.missions[Math.floor(Math.random() * (constants.missions.length - 1))]
      if (!Gamer.missions.find(m => m.title === randomMission.title)) Gamer.missions.push(randomMission)
    }

    Gamer.helpers.logger.green(`Preparing all cached settings like prefix, languages etc into cache now...`)
    // Cache all the guilds prefixes so we dont need to fetch it every message to check if its a command
    const allGuildSettings = await Gamer.database.models.guild.find()
    for (const settings of allGuildSettings) {
      if (settings.prefix !== Gamer.prefix) Gamer.guildPrefixes.set(settings.id, settings.prefix)
      if (settings.language !== `en-US`) Gamer.guildLanguages.set(settings.id, settings.language)
      if (settings.mails.supportChannelID)
        Gamer.guildSupportChannelIDs.set(settings.id, settings.mails.supportChannelID)
    }

    return Gamer.helpers.logger.green(`[READY] All shards completely ready now.`)
  }
}
