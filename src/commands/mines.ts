import { Command } from 'yuuko'
import Minesweeper from 'discord.js-minesweeper'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'

export default new Command([`minesweeper`, `mines`], async (message, _args, context) => {
	if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

	const Gamer = context.client as GamerClient
	const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || 'en-US')
	if (!language) return

	const minesweeper = new Minesweeper({ rows: 9, columns: 9, mines: 10 })
  const matrix = minesweeper.start()

  if (typeof matrix !== 'string') return

  return message.channel.createMessage(`${language('gaming/minesweeper:INSTRUCTIONS')}\n${matrix})
})
