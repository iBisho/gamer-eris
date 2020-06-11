import { Command } from 'yuuko'
import Gamer from '../..'

export default new Command('schema', async message => {
  const guilds = await Gamer.database.models.guild.find()
  for (const guild of guilds) {
    if (typeof guild.id === 'string') guild.guildID = guild.id
    guild.save()
  }
  message.channel.createMessage('guilds are updated')

  return message.channel.createMessage('done updating schema')
})
