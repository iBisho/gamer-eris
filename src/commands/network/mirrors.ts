import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`mirrors`], async (message, _args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient

  const responses = [...Gamer.mirrors.values()]
    // Only those mirrors that are relevant to this server.
    .filter(
      mirror => mirror.sourceGuildID === message.member?.guild.id || mirror.mirrorGuildID === message.member?.guild.id
    )
    .map(mirror => `<#${mirror.sourceChannelID}> => <#${mirror.mirrorChannelID}>`)

  return message.channel.createMessage(responses.join('\n'))
})
