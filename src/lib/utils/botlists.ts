import database from '../../database/mongodb'
import { milliseconds } from '../types/enums/time'
import config from '../../../config'
import Gamer from '../..'
import nodefetch from 'node-fetch'
import constants from '../../constants'

const botlistData = [
  {
    token: config.botlists.discordBotsGG,
    url: `https://discord.bots.gg/api/v1/bots/${constants.general.gamerID}/stats`
  },
  {
    token: config.botlists.botsOnDiscord,
    url: `https://bots.ondiscord.xyz/bot-api/bots/${constants.general.gamerID}/guilds`
  }
]

export const weeklyVoteReset = async () => {
  const now = Date.now()

  const clientSettings = await database.models.client.findOne()
  if (!clientSettings?.weeklyVoteTimestamp) return

  const lastPlusOneWeek = clientSettings.weeklyVoteTimestamp + milliseconds.WEEK

  if (lastPlusOneWeek < now) return

  clientSettings.weeklyVoteTimestamp = lastPlusOneWeek
  clientSettings.save()

  database.models.upvote.updateMany({}, { weeklyCount: 0 }).exec()
}

export function updateBotLists() {
  const guildCount = Gamer.guilds.size
  botlistData.forEach(data => {
    // Non production bots dont need to update stats
    if (!data.token) return

    nodefetch(data.url, {
      method: 'POST',
      headers: {
        authorization: data.token,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        guildCount
      })
    })
  })
}

export function processBotLists() {
  updateBotLists()
  setTimeout(() => updateBotLists(), milliseconds.HOUR)
}
