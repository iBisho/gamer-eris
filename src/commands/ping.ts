import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`ping`, `pong`], async (message, _args, context) => {
  const ping = Date.now() - message.timestamp
  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const embed = new GamerEmbed().setTitle(language(`basic/ping:TIME`, { time: ping / 1000 })).addField(
    language('basic/ping:STATS'),
    language(`basic/ping:STATS_VALUE`, {
      id: message.member ? message.member.guild.shard.id : 'Unknown',
      discord: `<:discord:494050000779608064>`,
      guilds: context.client.guilds.size.toLocaleString(),
      users: context.client.guilds.reduce((subtotal, guild) => subtotal + guild.memberCount, 0).toLocaleString()
    })
  )

  return message.channel.createMessage({ embed: embed.code })
})
