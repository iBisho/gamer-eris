import { Command } from 'yuuko'
import Gamer from '../..'

export default new Command('schema', async message => {
  let mainCounter = 0

  let xpLimit = 10000
  let lastXPLimit = 10000000

  let searching = true
  while (searching) {
    const settings = await Gamer.database.models.user.find({ xp: { $gt: xpLimit, $lt: lastXPLimit } })
    console.log('found settings amount:', settings.length, xpLimit)

    let counter = 0

    for (const setting of settings) {
      const duplicates = await Gamer.database.models.user.find({ userID: setting.userID })
      if (duplicates.length > 1) {
        for (const dupe of duplicates) {
          if (!dupe.guildIDs.length) {
            console.log(`Deleting Dupe: ${dupe._id} [${dupe.userID}]`)
            Gamer.database.models.user.deleteOne({ _id: dupe._id }).exec()
          }
        }
      }

      counter++
      mainCounter++
      console.log(`Completed ${counter} / ${settings.length} with limit ${xpLimit}`)
      if (counter === settings.length) {
        if (xpLimit === 0) {
          searching = false
          break
        }

        lastXPLimit = xpLimit
        xpLimit -= 50
        console.log('lowering xplimit to:', xpLimit)
        continue
      }
      console.log('Main Counter:', mainCounter)
    }
  }

  return message.channel.createMessage('done updating schema')
})
