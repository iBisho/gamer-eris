import Gamer from '../..'
import { Message } from 'eris'

export function dailyLifeTasksReset() {
  Gamer.database.models.marriage.updateMany({ lifeCounter: { $gt: 0 } }, { lifeCounter: 0 }).exec()
}

export async function completeMarriageTask(message: Message, commandName: string) {
  const spouseCommands = [`hug`, `kiss`, `tickle`, `cuddle`]
  if (!spouseCommands.includes(commandName)) return

  const marriage = await Gamer.database.models.marriage
    .findOne()
    .or([{ authorID: message.author.id }, { spouseID: message.author.id, accepted: true }])
  if (!marriage) return

  if (marriage.love >= 100) return

  marriage.love++
  marriage.save()
}
