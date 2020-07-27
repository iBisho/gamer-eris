import { Command } from 'yuuko'
import Gamer from '../..'

export default new Command('schema', async message => {
  const records = await Gamer.database.models.spy.find()

  await Gamer.database.models.spy.deleteMany({}).exec()

  for (const record of records) {
    const exists = await Gamer.database.models.spy.findOne({ memberID: record.memberID })

    if (exists) {
      for (const word of record.words) {
        await Gamer.database.models.spy
          .findOneAndUpdate({ memberID: record.memberID }, { $addToSet: { words: word.toLowerCase() } })
          .exec()
      }
    } else {
      await Gamer.database.models.spy.create({
        memberID: record.memberID,
        words: record.words.map(w => w.toLowerCase())
      })
    }
  }

  return message.channel.createMessage('done updating schema')
})
