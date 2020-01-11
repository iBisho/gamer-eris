import { Command } from 'yuuko'
import Minesweeper from 'discord.js-minesweeper'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'

export default new Command([`minesweeper`, `mines`], async (message, _args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.channel.guild.id)

  const minesweeper = new Minesweeper({ rows: 9, columns: 9, mines: 10 })
  const matrix = minesweeper.start()

  if (typeof matrix !== 'string') return

  message.channel.createMessage(`${language('gaming/minesweeper:INSTRUCTIONS')}\n\n${matrix}`)
  return Gamer.helpers.levels.completeMission(message.member, `mines`, message.channel.guild.id)
})
