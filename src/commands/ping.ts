import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { TextChannel } from 'eris'

export default new Command('ping', (message, _args, context) => {
  const ping = Date.now() - message.timestamp

  const embed = new GamerEmbed()
    .setTitle(`Response Time: ${ping / 1000} seconds`)
    .addField(
      `**__General Bot Stats__**`,
      `🆔 ${
        message.channel instanceof TextChannel ? message.channel.guild.shard.id : 0
      } <:discord:494050000779608064> ${context.client.guilds.size} 👥 ${context.client.users.size}`
    )

  return message.channel.createMessage({ embed: embed.code })
})
