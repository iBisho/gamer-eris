/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { Command } from 'yuuko'
import Gamer from '../..'

export default new Command('schema', async message => {
  let mainCounter = 0

  let xpLimit = 1000

  let searching = true
  while (searching) {
    const settings = await Gamer.database.models.user.find({ 'leveling.xp': { $gt: xpLimit } })
    console.log('found settings amount:', settings.length, xpLimit)

    if (!settings.length) {
      if (xpLimit === 0) {
        searching = false
        break
      }

      xpLimit -= 50
      console.log('lowering xplimit to:', xpLimit)
      continue
    }

    let counter = 0

    for (const setting of settings) {
      const payload = {
        userID: setting.userID,
        guildIDs: setting.guildIDs,
        // @ts-ignore
        backgroundID: setting.profile.backgroundID,
        // @ts-ignore
        theme: setting.profile.theme,
        // @ts-ignore
        afkEnabled: setting.afk.enabled,
        // @ts-ignore
        afkMessage: setting.afk.message,
        // @ts-ignore
        isVIP: setting.vip.isVIP,
        // @ts-ignore
        vipGuildsRegistered: setting.vip.guildsRegistered,
        // @ts-ignore
        boosts: setting.leveling.boosts,
        // @ts-ignore
        xp: setting.leveling.xp,
        // @ts-ignore
        currency: setting.leveling.currency,
        // @ts-ignore
        networkGuildID: setting.network.guildID
      }

      await Gamer.database.models.user.deleteOne({ _id: setting._id })
      // @ts-ignore
      await Gamer.database.models.user.create(payload)

      counter++
      mainCounter++
      console.log(`Completed ${counter} / ${settings.length} with limit ${xpLimit}`)
      console.log('Main Counter:', mainCounter)
    }
  }

  return message.channel.createMessage('done updating schema')
})
