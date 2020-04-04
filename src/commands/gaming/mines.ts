import { Command } from 'yuuko'
import Minesweeper from 'discord.js-minesweeper'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`minesweeper`, `mines`], async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const minesweeper = new Minesweeper({ rows: 9, columns: 9, mines: 10 })
  const matrix = minesweeper.start()

  if (typeof matrix !== 'string') return

  message.channel.createMessage(`${language('gaming/minesweeper:INSTRUCTIONS')}\n\n${matrix}`)
  if (message.member && message.guildID) Gamer.helpers.levels.completeMission(message.member, `mines`, message.guildID)
})
