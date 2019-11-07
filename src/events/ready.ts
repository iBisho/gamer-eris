// This event is triggered once the bot is ready and online.
import Event from '../lib/structures/Event'
import Gamer from '../index'
import { GuildSettings } from '../lib/types/settings'
import { TextChannel } from 'eris'
import constants from '../constants'

// 10 minutes
const maxInactiveTime = 600000
const DAILY = 1000 * 60 * 60 * 24
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
    }, 120000)

    // Clean up inactive verification channels
    setInterval(async () => {
      // Fetch this guilds settings
      const allGuildSettings = (await Gamer.database.models.guild.find()) as GuildSettings[]
      // We only loop over saved settings guilds because if they use defaults they they wont have verify enabled anyway
      const promises = allGuildSettings.map(async guildSettings => {
        // If this server does not enable the verification system skip or if they have no verification channels.
        if (!guildSettings.verify.enabled || !guildSettings.verify.channelIDs.length) return

        const guild = Gamer.guilds.get(guildSettings.id)
        if (!guild) return

        for (const channelID of guildSettings.verify.channelIDs) {
          const channel = guild.channels.get(channelID)
          if (!(channel instanceof TextChannel)) return

          // If missing channel perms exit out
          if (channel.permissionsOf(Gamer.user.id).has('manageChannels')) return

          const message =
            channel.messages.get(channel.lastMessageID) ||
            (await channel.getMessage(channel.lastMessageID).catch(() => null))
          // If no message something is very wrong as the first json message should always be there to be safe just cancel
          if (!message) return

          const guildSettings = (await Gamer.database.models.guild.findOne({
            id: guild.id
          })) as GuildSettings | null

          const language = Gamer.i18n.get(guildSettings ? guildSettings.language : 'en-US')
          if (!language) return

          // If the channel has gone inactive too long delete it so there is no spam empty unused channels
          if (Date.now() - message.timestamp > maxInactiveTime)
            channel.delete(language(`basic/verify:CHANNEL_DELETE_REASON`))
        }
      })

      Promise.all(promises)
    }, maxInactiveTime)

    // Randomly select 3 new missions to use every day
    setInterval(() => {
      // Remove all missions first before creating any new missions
      Gamer.database.models.mission.deleteMany({})

      // Find 3 new random missions to use for today
      Gamer.missions = []
      for (let i = 0; i < 3; i++)
        Gamer.missions.push(constants.missions[Math.floor(Math.random() * (constants.missions.length - 1))])
    }, DAILY)

    return Gamer.helpers.logger.green(`[READY] All shards completely ready now.`)
  }
}
