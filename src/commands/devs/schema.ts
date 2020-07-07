/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { Command } from 'yuuko'
import Gamer from '../..'

export default new Command('schema', async message => {
  let counter = 0
  const settings = await Gamer.database.models.user.find()
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

    await Gamer.database.models.user.replaceOne({ userID: payload.userID }, payload).exec()
    counter++
    console.log(`Completed ${counter} / ${settings.length}`)
  }

  return message.channel.createMessage('done updating schema')
})
