import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { TextChannel, PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`ping`, `pong`], async (message, _args, context) => {
  const ping = Date.now() - message.timestamp

  const Gamer = context.client as GamerClient
  const settings =
    message.channel instanceof PrivateChannel
      ? null
      : await Gamer.database.models.guild.findOne({ id: message.channel.guild.id }).select('language').exec()

  console.log(settings)

  const language = (context.client as GamerClient).i18n.get(settings ? settings.language : 'en-US')
  if (!language) return null

  const embed = new GamerEmbed()
    .setTitle(language(`basic/ping:TIME`, { time: ping / 1000 }))
    .addField(language('basic/ping:STATS'), language(`basic/ping:STATS_VALUE`, {
      id: message.channel instanceof TextChannel ? message.channel.guild.shard.id : 0,
      discord: `<:discord:494050000779608064>`,
      guilds: context.client.guilds.size,
      users: context.client.users.size
    }) as string)

  return message.channel.createMessage({ embed: embed.code })
})
