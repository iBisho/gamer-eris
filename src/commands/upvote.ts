import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default new Command([`upvote`, `vote`], async (message, _args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  // const upvote
  const embed = new GamerEmbed().setTitle(
    language('basic/upvote:CLICK_HERE'),
    'https://top.gg/bot/270010330782892032/vote'
  )
  // .setDescription(language('basic/upvote:REWARDS'))

  message.channel.createMessage({ embed: embed.code })
  // if (message.member) return Gamer.helpers.levels.completeMission(message.member, `8ball`, message.guildID)
})
